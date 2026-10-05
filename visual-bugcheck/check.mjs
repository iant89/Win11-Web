// Win11-Web visual bug check.
// Drives a headless Chromium through every major UI surface, saves
// screenshots to visual-bugcheck/shots/, and runs DOM-level assertions for
// the known visual bugs (see REPORT.md). Prints a findings table.
//
// Run via: visual-bugcheck/check.sh   (sets up deps, browser and dev server)
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'visual-bugcheck', 'shots');
const CHROME_BIN = process.env.CHROME_BIN || '/tmp/win11web-browser/chromium';
const BASE = process.env.BASE_URL || 'http://localhost:5173/';

if (!existsSync(CHROME_BIN)) { console.error('browser not found at ' + CHROME_BIN + ' — run visual-bugcheck/install-browser.sh'); process.exit(1); }
mkdirSync(SHOTS, { recursive: true });

const findings = [];
const report = (id, name, bug, detail = '') => {
  findings.push({ id, name, bug, detail });
  console.log(`${bug ? '🐞 BUG ' : '✅ ok  '} ${id}  ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch({
  executablePath: CHROME_BIN,
  args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu',
         '--font-render-hinting=none', '--force-color-profile=srgb'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
const shot = n => page.screenshot({ path: join(SHOTS, n + '.png') });
const sleep = ms => page.waitForTimeout(ms);
const closeAllWindows = () => page.evaluate(() => document.querySelectorAll('.window .close').forEach(b => b.click()));

// ---------- boot ----------
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
{
  const r = await page.evaluate(() => {
    const bg = getComputedStyle(document.querySelector('#boot-screen')).backgroundColor;
    const hex = document.querySelector('.boot-logo path')?.getAttribute('fill') || '#000000';
    const m = hex.replace('#', '').match(/../g).map(h => parseInt(h, 16));
    return { bg, logo: `rgb(${m[0]}, ${m[1]}, ${m[2]})` };
  });
  report('B1', 'boot logo visible', r.bg === r.logo, `bg=${r.bg} logo=${r.logo}`);
}
await shot('01-boot');
await sleep(2800); // boot hides + demo windows open
await shot('02-desktop');

// ---------- taskbar centering ----------
{
  const r = await page.evaluate(() => {
    const c = document.querySelector('.taskbar-center').getBoundingClientRect();
    return { off: Math.round((c.left + c.width / 2) - innerWidth / 2) };
  });
  report('B12', 'taskbar cluster centered', Math.abs(r.off) > 10, `offset=${r.off}px`);
}

// ---------- start menu ----------
await page.click('#start-btn'); await sleep(600);
await shot('03-start-menu');
{
  const r = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#pinned-grid .pinned-item')];
    const names = items.map(i => i.querySelector('span:last-child').textContent);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    const bad = items.filter(i => {
      const n = i.querySelector('span:last-child').textContent, app = i.dataset.app;
      return (n === 'Paint' && app === 'edge') || (n === 'Spotify' && app === 'store') || (n === 'Terminal' && app === 'notepad');
    }).map(i => `${i.querySelector('span:last-child').textContent}→${i.dataset.app}`);
    return { dupes, bad };
  });
  report('B9', 'pinned apps consistent', r.dupes.length > 0 || r.bad.length > 0, [...r.dupes.map(d => `dup:${d}`), ...r.bad].join(', '));
}
await page.fill('#start-search', 'term'); await sleep(400);
await shot('04-start-search');
await page.fill('#start-search', ''); await sleep(200);
await page.keyboard.press('Escape'); await sleep(300);

// ---------- widgets ----------
await page.click('#widgets-btn'); await sleep(600);
await shot('05-widgets');
{
  const r = await page.evaluate(() => {
    const panel = document.querySelector('#widgets-panel').getBoundingClientRect();
    const cards = [...document.querySelectorAll('.widget-card')].map(c => c.getBoundingClientRect().bottom);
    return { gap: Math.round(panel.bottom - Math.max(...cards)) };
  });
  report('B7', 'widgets panel hugs content', r.gap > 120, `empty=${r.gap}px`);
}
await page.keyboard.press('Escape'); await sleep(300);

// ---------- quick settings + toast overlap ----------
await page.click('#quicksettings-btn'); await sleep(600);
await shot('06-quick-settings');
await page.fill('#brightness', '90'); await sleep(400);
{
  const r = await page.evaluate(() => {
    const t = document.querySelector('.toast')?.getBoundingClientRect();
    const q = document.querySelector('#quick-settings').getBoundingClientRect();
    if (!t) return { overlap: false };
    return { overlap: t.left < q.right && t.right > q.left && t.top < q.bottom && t.bottom > q.top };
  });
  report('B6', 'toasts clear of flyouts', r.overlap, r.overlap ? 'toast covers quick settings' : '');
  await shot('20-toast');
}
await sleep(3500);
await page.keyboard.press('Escape'); await sleep(300);

// ---------- notifications ----------
await page.click('#notif-btn'); await sleep(600);
await shot('07-notifications');
{
  const r = await page.evaluate(() => {
    const txt = document.querySelector('.nc-cal-header b').textContent.trim();
    const now = new Date();
    const expected = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { txt, expected };
  });
  report('B11', 'calendar matches today', r.txt !== r.expected, `shows "${r.txt}", today is ${r.expected}`);
}
await page.keyboard.press('Escape'); await sleep(300);

// ---------- task view ----------
await page.click('#taskview-btn'); await sleep(600);
await shot('08-taskview');
{
  const r = await page.evaluate(() => {
    const t = document.querySelector('.tv-timeline').getBoundingClientRect();
    const bar = document.querySelector('#taskbar').getBoundingClientRect();
    return { hidden: t.bottom > bar.top + 4 };
  });
  report('B8', 'task view timeline visible', r.hidden, r.hidden ? 'timeline sits under the taskbar' : '');
}
await page.click('#close-taskview'); await sleep(300);

// ---------- context menu ----------
await page.mouse.click(1500, 800, { button: 'right' }); await sleep(400);
await shot('09-context-menu');
await page.keyboard.press('Escape'); await sleep(300);

// ---------- ghost windows (close two in the same tick) ----------
await closeAllWindows(); await sleep(500);
await page.evaluate(() => window._openApp('notepad')); await sleep(300);
await page.evaluate(() => window._openApp('explorer')); await sleep(300);
await closeAllWindows(); await sleep(700);
{
  const r = await page.evaluate(() => ({ n: document.querySelectorAll('#running-apps .task-icon').length }));
  report('B3', 'no ghost taskbar icons after bulk close', r.n !== 0, `${r.n} stale icon(s)`);
}

// ---------- store ----------
await page.evaluate(() => window._openApp('store')); await sleep(700);
await shot('10-store');
{
  const r = await page.evaluate(() => {
    const h = card => card.querySelector('.rating').getBoundingClientRect().height;
    const cards = [...document.querySelectorAll('.app-card')];
    const inst = cards.find(c => c.querySelector('button.installed'));
    const norm = cards.find(c => !c.querySelector('button.installed'));
    return { inst: inst ? Math.round(h(inst)) : 0, norm: norm ? Math.round(h(norm)) : 0 };
  });
  report('B10', 'store card footers aligned', r.inst - r.norm > 6, `installed rating ${r.inst}px vs ${r.norm}px`);
}
await closeAllWindows(); await sleep(400);

// ---------- apps ----------
await page.evaluate(() => window._openApp('notepad')); await sleep(500); await shot('11-notepad'); await closeAllWindows(); await sleep(300);
await page.evaluate(() => window._openApp('calculator')); await sleep(500); await shot('12-calculator');
for (const k of ['7', '+', '5', '=']) await page.click(`.calc button[data-c="${k}"]`);
await sleep(300); await shot('12b-calc-result'); await closeAllWindows(); await sleep(300);
await page.evaluate(() => window._openApp('settings')); await sleep(500); await shot('13-settings'); await closeAllWindows(); await sleep(300);
await page.evaluate(() => window._openApp('vscode')); await sleep(500); await shot('14-vscode'); await closeAllWindows(); await sleep(300);
await page.evaluate(() => window._openApp('photos')); await sleep(500); await shot('15-photos'); await closeAllWindows(); await sleep(300);

// ---------- explorer ----------
await page.evaluate(() => window._openApp('explorer', { path: 'Documents' })); await sleep(600);
await shot('16-explorer-grid');
await page.click('.window [data-view="list"]'); await sleep(400);
await shot('16b-explorer-list');

// ---------- snap popup ----------
await page.hover('.window .max-btn'); await sleep(500);
await shot('17-snap-popup');
{
  const r = await page.evaluate(() => {
    const o = document.querySelector('.window .snap-option');
    const s = o?.querySelector('span')?.getBoundingClientRect();
    return { oh: Math.round(o?.getBoundingClientRect().height || 0), sw: Math.round(s?.width || 0) };
  });
  report('B2', 'snap popup options visible', !(r.oh >= 30 && r.sw > 0), `option ${r.oh}px tall, preview span ${r.sw}px wide`);
}
await page.click('.window .max-btn'); await sleep(500);
await shot('18-maximized');
await page.click('.window .max-btn'); await sleep(400);
await closeAllWindows(); await sleep(400);

// ---------- snap halves partner ----------
await page.evaluate(() => window._openApp('explorer')); await sleep(400);
await page.evaluate(() => window._openApp('notepad')); await sleep(400);
await page.hover('.window.active .max-btn'); await sleep(400);
await page.click('.window.active .snap-option[data-layout="halves"]'); await sleep(600);
{
  const r = await page.evaluate(() => {
    const w = [...document.querySelectorAll('.window')].map(x => x.getBoundingClientRect());
    const partner = w.find(x => x.width > 1); // not snapped-left one
    return { left: Math.round(partner?.left ?? -1), half: innerWidth / 2 };
  });
  report('B4', 'snap partner fills other half', Math.abs(r.left - r.half) > 20, `partner left=${r.left}, expected ${r.half}`);
  await shot('19-snap-halves');
}
await closeAllWindows(); await sleep(400);

// ---------- small viewport ----------
await page.setViewportSize({ width: 1280, height: 720 }); await sleep(600);
await shot('21-small-desktop');
await page.click('#start-btn'); await sleep(600);
await shot('22-small-start');
{
  const r = await page.evaluate(() => {
    const m = document.querySelector('#start-menu');
    return { delta: m.scrollHeight - m.clientHeight, scrollable: getComputedStyle(m).overflowY !== 'visible' };
  });
  report('B5', 'start menu scrollable when short', r.delta > 4 && !r.scrollable, r.delta > 4 ? `content overflows by ${r.delta}px, overflow visible` : 'fits');
}

await browser.close();

const bugs = findings.filter(f => f.bug);
console.log(`\n${findings.length - bugs.length} ok, ${bugs.length} bug(s): ${bugs.map(b => b.id).join(', ') || 'none'}`);
console.log('screenshots in visual-bugcheck/shots/');
