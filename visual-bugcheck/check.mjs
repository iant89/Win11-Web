#!/usr/bin/env node
/**
 * check.mjs — Win11-Web visual bug check.
 *
 * Drives a headless Chromium (provisioned by install-browser.sh) through
 * every major UI surface, saves screenshots to visual-bugcheck/shots/, and
 * asserts the known visual bugs B1–B12 (see REPORT.md for details and the
 * fix log). Prints a findings table and a summary.
 *
 * Usage:
 *   node visual-bugcheck/check.mjs [options]
 *
 * Options:
 *   --base-url URL     app URL to test            [default: $BASE_URL or http://localhost:5173/]
 *   --shots-dir DIR    screenshot output dir      [default: visual-bugcheck/shots]
 *   --skip-shots       assertions only, no screenshots
 *   --fail-on-bug      exit with code 2 when a bug is detected (for CI)
 *   --list             print the check catalogue and exit
 *   -h, --help         show this help
 *
 * Exit codes:
 *   0  run completed, no bugs (or bugs found without --fail-on-bug)
 *   1  infrastructure error (missing browser, page crash, timeout, …)
 *   2  bugs found and --fail-on-bug was given
 */
import { parseArgs } from 'node:util';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: opt } = parseArgs({
  options: {
    'base-url':    { type: 'string' },
    'shots-dir':   { type: 'string' },
    'skip-shots':  { type: 'boolean', default: false },
    'fail-on-bug': { type: 'boolean', default: false },
    'list':        { type: 'boolean', default: false },
    'help':        { type: 'boolean', short: 'h', default: false },
  },
});

if (opt.help) {
  const help = [
    'check.mjs — Win11-Web visual bug check',
    '',
    'Usage: node visual-bugcheck/check.mjs [options]',
    '',
    '  --base-url URL   app URL to test        [env BASE_URL, default http://localhost:5173/]',
    '  --shots-dir DIR  screenshot output dir  [default visual-bugcheck/shots]',
    '  --skip-shots     assertions only, no screenshots',
    '  --fail-on-bug    exit 2 when a bug is detected (CI mode)',
    '  --list           print the check catalogue and exit',
    '  -h, --help       show this help',
  ];
  console.log(help.join('\n'));
  process.exit(0);
}

const BASE    = opt['base-url'] || process.env.BASE_URL || 'http://localhost:5173/';
const SHOTS   = resolve(opt['shots-dir'] || join(ROOT, 'visual-bugcheck', 'shots'));
const CHROME  = process.env.CHROME_BIN || '/tmp/win11web-browser/chromium';

// ---------------------------------------------------------------------------
// logging
// ---------------------------------------------------------------------------
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = c('1'), green = c('32'), red = c('31'), dim = c('2');
const log = (m) => console.log(m);

// ---------------------------------------------------------------------------
// check catalogue
// ---------------------------------------------------------------------------
const CATALOGUE = [
  ['B1',  'boot logo visible'],
  ['B2',  'snap popup options visible'],
  ['B3',  'no ghost taskbar icons after bulk close'],
  ['B4',  'snap partner fills other half'],
  ['B5',  'start menu scrollable when short'],
  ['B6',  'toasts clear of flyouts'],
  ['B7',  'widgets panel hugs content'],
  ['B8',  'task view timeline visible'],
  ['B9',  'pinned apps consistent'],
  ['B10', 'store card footers aligned'],
  ['B11', 'calendar matches today'],
  ['B12', 'taskbar cluster centered'],
];
if (opt.list) {
  for (const [id, name] of CATALOGUE) console.log(`${id.padEnd(4)} ${name}`);
  process.exit(0);
}

const results = [];
const pageErrors = [];
const record = (id, name, bug, detail = '') => {
  results.push({ id, name, bug, detail });
  log(`${bug ? red('🐞 BUG ') : green('✅ ok  ')} ${id.padEnd(4)} ${name}${detail ? dim(' — ' + detail) : ''}`);
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const shot = (name) => opt['skip-shots'] ? Promise.resolve()
  : page.screenshot({ path: join(SHOTS, name + '.png') });
const sleep = (ms) => page.waitForTimeout(ms);
const closeAllWindows = () => page.evaluate(() =>
  document.querySelectorAll('.window .close').forEach((b) => b.click()));
const openApp = (app, opts) => page.evaluate(([a, o]) => window._openApp(a, o), [app, opts]);
async function step(title, fn) {
  const t0 = Date.now();
  log(bold(`\n── ${title}`));
  await fn();
  log(dim(`   (${((Date.now() - t0) / 1000).toFixed(1)}s)`));
}

// ---------------------------------------------------------------------------
// browser
// ---------------------------------------------------------------------------
if (!existsSync(CHROME)) {
  console.error(`error: browser not found at ${CHROME} — run visual-bugcheck/install-browser.sh`);
  process.exit(1);
}
if (!opt['skip-shots']) mkdirSync(SHOTS, { recursive: true });

let browser;
try {
  browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu',
           '--font-render-hinting=none', '--force-color-profile=srgb'],
  });
} catch (err) {
  console.error(red('error:'), 'failed to launch Chromium —', err.message.split('\n')[0]);
  console.error('hint: run via visual-bugcheck/check.sh, or source $BROWSER_DIR/env.sh first');
  process.exit(1);
}

let page;
try {
  page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await run();
} catch (err) {
  console.error(red('error:'), err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
if (process.exitCode) process.exit(process.exitCode);

// ---------------------------------------------------------------------------
// the tour
// ---------------------------------------------------------------------------
async function run() {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });

  await step('boot', async () => {
    const r = await page.evaluate(() => {
      const bg = getComputedStyle(document.querySelector('#boot-screen')).backgroundColor;
      const hex = document.querySelector('.boot-logo path')?.getAttribute('fill') || '#000000';
      const [rr, gg, bb] = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16));
      return { bg, logo: `rgb(${rr}, ${gg}, ${bb})` };
    });
    record('B1', 'boot logo visible', r.bg === r.logo, `bg=${r.bg} logo=${r.logo}`);
    await shot('01-boot');
  });

  await sleep(2800); // boot hides, demo windows open
  await step('desktop', async () => {
    await shot('02-desktop');
    const r = await page.evaluate(() => {
      const el = document.querySelector('.taskbar-center').getBoundingClientRect();
      return { off: Math.round(el.left + el.width / 2 - innerWidth / 2) };
    });
    record('B12', 'taskbar cluster centered', Math.abs(r.off) > 10, `offset=${r.off}px`);
  });

  await step('start menu', async () => {
    await page.click('#start-btn'); await sleep(600);
    await shot('03-start-menu');
    const r = await page.evaluate(() => {
      const items = [...document.querySelectorAll('#pinned-grid .pinned-item')];
      const label = (i) => i.querySelector('span:last-child').textContent;
      const names = items.map(label);
      const dupes = names.filter((n, i) => names.indexOf(n) !== i);
      const bad = items
        .filter((i) => ({ Paint: 'edge', Spotify: 'store', Terminal: 'notepad' }[label(i)] === i.dataset.app))
        .map((i) => `${label(i)}→${i.dataset.app}`);
      return { dupes: [...new Set(dupes)], bad };
    });
    record('B9', 'pinned apps consistent', r.dupes.length > 0 || r.bad.length > 0,
      [...r.dupes.map((d) => `dup:${d}`), ...r.bad].join(', '));

    await page.fill('#start-search', 'term'); await sleep(400);
    await shot('04-start-search');
    await page.fill('#start-search', ''); await sleep(200);
    await page.keyboard.press('Escape'); await sleep(300);
  });

  await step('widgets', async () => {
    await page.click('#widgets-btn'); await sleep(600);
    await shot('05-widgets');
    const r = await page.evaluate(() => {
      const panel = document.querySelector('#widgets-panel').getBoundingClientRect();
      const cards = [...document.querySelectorAll('.widget-card')].map((el) => el.getBoundingClientRect().bottom);
      return { gap: Math.round(panel.bottom - Math.max(...cards)) };
    });
    record('B7', 'widgets panel hugs content', r.gap > 120, `empty=${r.gap}px`);
    await page.keyboard.press('Escape'); await sleep(300);
  });

  await step('quick settings + toasts', async () => {
    await page.click('#quicksettings-btn'); await sleep(600);
    await shot('06-quick-settings');
    await page.fill('#brightness', '90'); await sleep(400);
    const r = await page.evaluate(() => {
      const t = document.querySelector('.toast')?.getBoundingClientRect();
      const q = document.querySelector('#quick-settings').getBoundingClientRect();
      return { overlap: !!t && t.left < q.right && t.right > q.left && t.top < q.bottom && t.bottom > q.top };
    });
    record('B6', 'toasts clear of flyouts', r.overlap, r.overlap ? 'toast covers quick settings' : '');
    await shot('20-toast');
    await sleep(3500);
    await page.keyboard.press('Escape'); await sleep(300);
  });

  await step('notification center', async () => {
    await page.click('#notif-btn'); await sleep(600);
    await shot('07-notifications');
    const r = await page.evaluate(() => ({
      txt: document.querySelector('.nc-cal-header b').textContent.trim(),
      expected: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }));
    record('B11', 'calendar matches today', r.txt !== r.expected, `shows "${r.txt}", today is ${r.expected}`);
    await page.keyboard.press('Escape'); await sleep(300);
  });

  await step('task view', async () => {
    await page.click('#taskview-btn'); await sleep(600);
    await shot('08-taskview');
    const r = await page.evaluate(() => {
      const t = document.querySelector('.tv-timeline').getBoundingClientRect();
      const bar = document.querySelector('#taskbar').getBoundingClientRect();
      return { hidden: t.bottom > bar.top + 4 };
    });
    record('B8', 'task view timeline visible', r.hidden, r.hidden ? 'timeline sits under the taskbar' : '');
    await page.click('#close-taskview'); await sleep(300);
  });

  await step('desktop context menu', async () => {
    await page.mouse.click(1500, 800, { button: 'right' }); await sleep(400);
    await shot('09-context-menu');
    await page.keyboard.press('Escape'); await sleep(300);
  });

  await step('window manager: bulk close', async () => {
    await closeAllWindows(); await sleep(500);
    await openApp('notepad'); await sleep(300);
    await openApp('explorer'); await sleep(300);
    await closeAllWindows(); await sleep(700);
    const r = await page.evaluate(() => ({ n: document.querySelectorAll('#running-apps .task-icon').length }));
    record('B3', 'no ghost taskbar icons after bulk close', r.n !== 0, `${r.n} stale icon(s)`);
  });

  await step('microsoft store', async () => {
    await openApp('store'); await sleep(700);
    await shot('10-store');
    const r = await page.evaluate(() => {
      const h = (card) => card.querySelector('.rating').getBoundingClientRect().height;
      const cards = [...document.querySelectorAll('.app-card')];
      const inst = cards.find((el) => el.querySelector('button.installed'));
      const norm = cards.find((el) => !el.querySelector('button.installed'));
      return { inst: inst ? Math.round(h(inst)) : 0, norm: norm ? Math.round(h(norm)) : 0 };
    });
    record('B10', 'store card footers aligned', r.inst - r.norm > 6, `installed rating ${r.inst}px vs ${r.norm}px`);
    await closeAllWindows(); await sleep(400);
  });

  await step('apps', async () => {
    for (const [app, name] of [['notepad', '11-notepad'], ['calculator', '12-calculator'],
      ['settings', '13-settings'], ['vscode', '14-vscode'], ['photos', '15-photos']]) {
      await openApp(app); await sleep(500);
      await shot(name);
      if (app === 'calculator') {
        for (const k of ['7', '+', '5', '=']) await page.click(`.calc button[data-c="${k}"]`);
        await sleep(300); await shot('12b-calc-result');
      }
      await closeAllWindows(); await sleep(300);
    }
  });

  await step('file explorer + snap layouts', async () => {
    await openApp('explorer', { path: 'Documents' }); await sleep(600);
    await shot('16-explorer-grid');
    await page.click('.window [data-view="list"]'); await sleep(400);
    await shot('16b-explorer-list');

    await page.hover('.window .max-btn'); await sleep(500);
    await shot('17-snap-popup');
    const r = await page.evaluate(() => {
      const o = document.querySelector('.window .snap-option');
      const s = o?.querySelector('span')?.getBoundingClientRect();
      return { oh: Math.round(o?.getBoundingClientRect().height || 0), sw: Math.round(s?.width || 0) };
    });
    record('B2', 'snap popup options visible', !(r.oh >= 30 && r.sw > 0),
      `option ${r.oh}px tall, preview span ${r.sw}px wide`);

    await page.click('.window .max-btn'); await sleep(500);
    await shot('18-maximized');
    await page.click('.window .max-btn'); await sleep(400);
    await closeAllWindows(); await sleep(400);
  });

  await step('snap halves partner', async () => {
    await openApp('explorer'); await sleep(400);
    await openApp('notepad'); await sleep(400);
    await page.hover('.window.active .max-btn'); await sleep(400);
    await page.click('.window.active .snap-option[data-layout="halves"]'); await sleep(600);
    const r = await page.evaluate(() => {
      const w = [...document.querySelectorAll('.window')].map((el) => el.getBoundingClientRect());
      const partner = w.find((x) => x.width > 1);
      return { left: Math.round(partner?.left ?? -1), half: innerWidth / 2 };
    });
    record('B4', 'snap partner fills other half', Math.abs(r.left - r.half) > 20,
      `partner left=${r.left}, expected ${r.half}`);
    await shot('19-snap-halves');
    await closeAllWindows(); await sleep(400);
  });

  await step('small viewport (1280×720)', async () => {
    await page.setViewportSize({ width: 1280, height: 720 }); await sleep(600);
    await shot('21-small-desktop');
    await page.click('#start-btn'); await sleep(600);
    await shot('22-small-start');
    const r = await page.evaluate(() => {
      const m = document.querySelector('#start-menu');
      return {
        delta: m.scrollHeight - m.clientHeight,
        scrollable: getComputedStyle(m).overflowY !== 'visible' ||
          [...m.children].some((el) => getComputedStyle(el).overflowY === 'auto'),
      };
    });
    record('B5', 'start menu scrollable when short', r.delta > 4 && !r.scrollable,
      r.delta > 4 ? `content overflows by ${r.delta}px, not scrollable` : 'fits');
  });

  // ------------------------------------------------------------------ summary
  const bugs = results.filter((r) => r.bug);
  log(bold('\n── summary'));
  log(`${green(`${results.length - bugs.length} ok`)}, ${bugs.length ? red(`${bugs.length} bug(s)`) : '0 bug(s)'}: ` +
    (bugs.map((b) => b.id).join(', ') || 'none'));
  if (pageErrors.length) log(red(`⚠ ${pageErrors.length} unexpected page error(s): `) + pageErrors.join(' | '));
  if (!opt['skip-shots']) log(dim(`screenshots in ${SHOTS}`));
  if (bugs.length && opt['fail-on-bug']) process.exit(2);
}
