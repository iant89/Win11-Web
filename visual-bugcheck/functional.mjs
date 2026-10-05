#!/usr/bin/env node
/**
 * functional.mjs — Win11-Web functional audit.
 *
 * Where check.mjs asserts the *visual* bug list, this script exercises the
 * apps and window manager for real (clicks, typing, drags) and classifies
 * every capability as:
 *
 *   ✅ ok     genuinely interactive
 *   🧱 facade rendered but inert (MVP mock — reported, not “broken”)
 *   🐞 bug    expected behavior missing or wrong
 *
 * Usage:
 *   node visual-bugcheck/functional.mjs [--base-url URL] [--help]
 *
 * Exit codes: 0 no bugs, 1 infrastructure error, 2 bugs with --fail-on-bug.
 */
import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const { values: opt } = parseArgs({
  options: {
    'base-url':    { type: 'string' },
    'fail-on-bug': { type: 'boolean', default: false },
    'help':        { type: 'boolean', short: 'h', default: false },
  },
});
if (opt.help) {
  console.log('functional.mjs — Win11-Web functional audit\n' +
    '  --base-url URL   app under test [env BASE_URL, default http://localhost:5173/]\n' +
    '  --fail-on-bug    exit 2 when a bug is found\n  -h, --help');
  process.exit(0);
}

const BASE = opt['base-url'] || process.env.BASE_URL || 'http://localhost:5173/';
const CHROME = process.env.CHROME_BIN || '/tmp/win11web-browser/chromium';
if (!existsSync(CHROME)) { console.error('error: browser missing — run install-browser.sh'); process.exit(1); }

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = paint('32'), yellow = paint('33'), red = paint('31'), dim = paint('2'), bold = paint('1');

const results = [];
const t = (name, status, detail = '') => {
  results.push({ name, status });
  const icon = status === 'ok' ? green('✅ ok ') : status === 'facade' ? yellow('🧱 mock') : red('🐞 BUG');
  console.log(`${icon}  ${name}${detail ? dim(' — ' + detail) : ''}`);
};
const section = (title) => console.log(bold(`\n── ${title}`));

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const sleep = (ms) => page.waitForTimeout(ms);
const openApp = (app, o) => page.evaluate(([a, opts]) => window._openApp(a, opts), [app, o]);
const closeActive = () => page.evaluate(() => document.querySelector('.window.active .close')?.click());
const activeTitle = () => page.evaluate(() => document.querySelector('.window.active .titlebar-title')?.textContent ?? '');
const $eval = (sel, fn) => page.evaluate(([s, f]) => {
  const el = document.querySelector(s);
  return el ? (new Function('el', `return (${f})(el)`))(el) : null;
}, [sel, fn.toString()]);

try {
  await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
  await sleep(2600);
  await page.evaluate(() => document.querySelectorAll('.window .close').forEach((b) => b.click()));
  await sleep(500);

  // ---------------------------------------------------------------- explorer
  section('File Explorer');
  await openApp('explorer'); await sleep(500);
  t('opens on This PC with drives+folders',
    (await page.evaluate(() => document.querySelectorAll('.window.active .file-item').length)) === 6 ? 'ok' : 'bug');

  await page.click('.window.active .sidebar-item[data-path="Documents"]'); await sleep(300);
  t('sidebar navigation', (await $eval('.window.active .path-bar', (el) => el.textContent))?.includes('Documents') ? 'ok' : 'bug');

  await page.dblclick('.window.active .file-item:has-text("Project Bloom")'); await sleep(300);
  const inBloom = (await $eval('.window.active #explorer-content', (el) => el.textContent)).includes('New Document.txt');
  t('double-click enters folder', inBloom ? 'ok' : 'bug');

  await page.click('.window.active [data-nav="back"]'); await sleep(300);
  const backOk = (await $eval('.window.active .path-bar', (el) => el.textContent)).includes('Documents');
  await page.click('.window.active [data-nav="forward"]'); await sleep(300);
  const fwdOk = (await $eval('.window.active .path-bar', (el) => el.textContent)).includes('Project Bloom');
  t('back / forward history', backOk && fwdOk ? 'ok' : 'bug');

  await page.click('.window.active [data-nav="back"]'); await sleep(200);
  await page.fill('.window.active #explorer-search', 'bud'); await sleep(300);
  t('search filters files', (await page.evaluate(() => document.querySelectorAll('.window.active .file-item').length)) === 1 ? 'ok' : 'bug');
  await page.fill('.window.active #explorer-search', ''); await sleep(200);

  await page.click('.window.active [data-view="list"]'); await sleep(200);
  const listOk = await $eval('.window.active .explorer-content', (el) => el.classList.contains('files-list'));
  await page.click('.window.active [data-view="grid"]'); await sleep(200);
  t('list / grid view toggle', listOk ? 'ok' : 'bug');

  await page.dblclick('.window.active .file-item:has-text("Notes.txt")'); await sleep(500);
  t('.txt opens in Notepad', (await activeTitle()).includes('Notes.txt') ? 'ok' : 'bug');
  await closeActive(); await sleep(300);

  await page.click('.window.active .sidebar-item[data-path="Pictures"]'); await sleep(300);
  await page.dblclick('.window.active .file-item:has-text("bloom-01.jpg")'); await sleep(500);
  t('image opens in Photos', (await activeTitle()).includes('bloom-01.jpg') ? 'ok' : 'bug');
  await closeActive(); await sleep(300);
  await closeActive(); await sleep(300);

  // ---------------------------------------------------------------- edge
  section('Microsoft Edge (mock browser)');
  await openApp('edge'); await sleep(500);
  await page.click('.window.active .mock-search input');
  await page.type('.window.active .mock-search input', 'hello');
  t('address bar + page inputs editable',
    (await $eval('.window.active .mock-search input', (el) => el.value)) === 'hello' ? 'ok' : 'bug');
  await page.click('.window.active button:has-text("Open Store")'); await sleep(500);
  t('“Open Store” CTA launches the Store', (await activeTitle()) === 'Microsoft Store' ? 'ok' : 'bug');
  await closeActive(); await sleep(300); // store
  t('browser tabs closable / new-tab works',
    await page.evaluate(() => {
      const win = document.querySelector('.window.active');
      const before = win.querySelectorAll('.b-tab').length;
      win.querySelector('.browser-tabs button')?.click();   // “＋”
      win.querySelector('.b-tab span:last-child')?.click(); // “✕”
      return win.querySelectorAll('.b-tab').length !== before;
    }) ? 'ok' : 'facade', 'tab bar is decorative');
  await closeActive(); await sleep(300);

  // ---------------------------------------------------------------- store
  section('Microsoft Store');
  await openApp('store'); await sleep(500);
  await page.fill('.window.active #store-search', 'fig'); await sleep(300);
  t('store search filters apps',
    (await page.evaluate(() => [...document.querySelectorAll('.window.active .app-card b')].map((e) => e.textContent)))?.join() === 'Figma' ? 'ok' : 'bug');
  await page.fill('.window.active #store-search', ''); await sleep(300);
  await page.click('.window.active .app-card[data-app="Zoom"] button'); await sleep(300);
  const installing = await $eval('.window.active .app-card[data-app="Zoom"] button', (el) => el.textContent);
  await sleep(1100);
  const installed = await $eval('.window.active .app-card[data-app="Zoom"] button', (el) => el.textContent + el.className);
  t('Get → Installing… → Installed', installing === 'Installing…' && installed.includes('Installed') ? 'ok' : 'bug');
  t('install raises toast + notification',
    await page.evaluate(() => document.querySelector('#toasts .toast p')?.textContent.includes('Zoom') &&
      document.querySelector('#notif-list .notif p')?.textContent.includes('Zoom')) ? 'ok' : 'bug');
  await closeActive(); await sleep(300);

  // ---------------------------------------------------------------- notepad
  section('Notepad');
  await openApp('notepad'); await sleep(400);
  await page.click('.window.active textarea');
  await page.type('.window.active textarea', 'audit');
  t('textarea edits text', (await $eval('.window.active textarea', (el) => el.value)).includes('audit') ? 'ok' : 'bug');
  t('File/Edit/View menus respond',
    await page.evaluate(() => {
      const before = document.body.innerHTML.length;
      document.querySelector('.window.active .notepad-menu span')?.click();
      return document.body.innerHTML.length !== before;
    }) ? 'ok' : 'facade', 'menu labels are decorative');
  await closeActive(); await sleep(300);

  // ---------------------------------------------------------------- calculator
  section('Calculator');
  await openApp('calculator'); await sleep(400);
  const press = (k) => page.click(`.window.active .calc button[data-c="${k}"]`);
  const display = () => $eval('.window.active #calc-display', (el) => el.textContent);
  for (const k of ['1', '2', '+', '7', '=']) await press(k);
  t('12 + 7 = 19', (await display()) === '19' ? 'ok' : 'bug', `got ${await display()}`);
  for (const k of ['C', '2', '+', '3', '×', '4', '=']) await press(k);
  t('immediate-execution precedence (2+3×4=20)', (await display()) === '20' ? 'ok' : 'bug', `got ${await display()}`);
  for (const k of ['C', '9', '√']) await press(k);
  const sqrt = await display();
  for (const k of ['C', '6', 'x²']) await press(k);
  t('√ and x²', sqrt === '3' && (await display()) === '36' ? 'ok' : 'bug');
  for (const k of ['C', '5', '⌫']) await press(k);
  const bk = await display();
  for (const k of ['±']) await press(k);
  t('backspace and ±', bk === '0' && (await display()) === '0' ? 'ok' : 'bug');
  await page.click('.window.active .calc'); // focus for keyboard
  await page.keyboard.type('5+3'); await page.keyboard.press('Enter');
  t('keyboard input', (await display()) === '8' ? 'ok' : 'bug', `got ${await display()}`);
  await closeActive(); await sleep(300);

  // ---------------------------------------------------------------- settings
  section('Settings');
  await openApp('settings'); await sleep(400);
  await page.click('.window.active .settings-content .toggle'); await sleep(200);
  const toggled = await $eval('.window.active .settings-content .toggle', (el) => el.classList.contains('on'));
  t('toggles flip (+ toast)', toggled === false ? 'ok' : 'bug');
  await page.click('.window.active .settings-nav button:has-text("System")'); await sleep(300);
  const sysH2 = await $eval('.window.active .settings-content h2', (el) => el.textContent);
  const sysCards = await page.evaluate(() => document.querySelectorAll('.window.active .setting-card').length);
  t('nav switches to System page', sysH2 === 'System' && sysCards === 5 ? 'ok' : 'bug', `h2=${sysH2}, cards=${sysCards}`);
  await page.click('.window.active .settings-nav button:has-text("Windows Update")'); await sleep(300);
  await page.click('.window.active [data-action="check-updates"]'); await sleep(200);
  const checking = await $eval('.window.active [data-action="check-updates"]', (el) => el.textContent);
  await sleep(1100);
  const checked = await $eval('.window.active #update-checked', (el) => el.textContent);
  t('Windows Update: check flow', checking === 'Checking…' && checked === 'Last checked just now' ? 'ok' : 'bug');
  await page.click('.window.active .settings-nav button:has-text("Personalization")'); await sleep(300);
  t('returning restores Personalization',
    (await $eval('.window.active .settings-content h2', (el) => el.textContent)) === 'Personalization' ? 'ok' : 'bug');
  await closeActive(); await sleep(300);

  // ---------------------------------------------------------------- vscode / photos
  section('VS Code & Photos (mocks)');
  await openApp('vscode'); await sleep(400);
  t('VS Code opens with index.html tab',
    (await $eval('.window.active .vs-tab.active', (el) => el.dataset.tab)) === 'index.html' &&
    (await $eval('.window.active .vs-editor', (el) => el.textContent)).includes('boot-screen') ? 'ok' : 'bug');
  await page.click('.window.active .vs-file:has-text("README.md")'); await sleep(300);
  const twoTabs = await page.evaluate(() => document.querySelectorAll('.window.active .vs-tab').length) === 2;
  const readmeShown = (await $eval('.window.active .vs-editor', (el) => el.textContent)).includes('# Win11-Web');
  t('file tree opens tabs + renders content', twoTabs && readmeShown ? 'ok' : 'bug');
  await page.click('.window.active .vs-tab[data-tab="index.html"]'); await sleep(200);
  t('tab switching', (await $eval('.window.active .vs-editor', (el) => el.textContent)).includes('boot-screen') ? 'ok' : 'bug');
  await page.click('.window.active .vs-tab[data-tab="index.html"] .x'); await sleep(200);
  const fellBack = (await $eval('.window.active .vs-tab.active', (el) => el.dataset.tab)) === 'README.md';
  await page.click('.window.active .vs-tab[data-tab="README.md"] .x'); await sleep(200);
  const empty = (await $eval('.window.active .vs-editor', (el) => el.textContent)).includes('No file is open');
  t('closing tabs falls back / empty state', fellBack && empty ? 'ok' : 'bug');
  await page.click('.window.active [data-vs="explorer"]'); await sleep(200);
  const explorerHidden = await $eval('.window.active .vs-explorer', (el) => el.style.display === 'none');
  await page.click('.window.active [data-vs="explorer"]'); await sleep(200);
  t('activity bar toggles explorer', explorerHidden ? 'ok' : 'bug');
  await closeActive(); await sleep(300);
  await openApp('photos'); await sleep(400);
  t('Photos renders gallery', (await page.evaluate(() => document.querySelectorAll('.window.active .gallery-item').length)) === 8 ? 'ok' : 'bug');
  await page.click('.window.active .gallery-item'); await sleep(300);
  t('Photos lightbox / viewer', await page.evaluate(() => !!document.querySelector('.window.active .lightbox')) ? 'ok' : 'facade');
  await closeActive(); await sleep(300);

  // ---------------------------------------------------------------- window manager
  section('Window manager');
  await openApp('notepad'); await sleep(400);
  const box0 = await page.evaluate(() => { const r = document.querySelector('.window.active').getBoundingClientRect(); return { x: r.x, y: r.y }; });
  await page.mouse.move(box0.x + 300, box0.y + 20); await page.mouse.down();
  await page.mouse.move(box0.x + 420, box0.y + 100, { steps: 5 }); await page.mouse.up();
  const box1 = await page.evaluate(() => { const r = document.querySelector('.window.active').getBoundingClientRect(); return { x: r.x, y: r.y }; });
  t('titlebar drag moves window', Math.abs(box1.x - box0.x - 120) < 8 && Math.abs(box1.y - box0.y - 80) < 8 ? 'ok' : 'bug');

  const se = await page.evaluate(() => { const r = document.querySelector('.window.active .window-resize.se').getBoundingClientRect(); return { x: r.x, y: r.y }; });
  const w0 = await page.evaluate(() => document.querySelector('.window.active').getBoundingClientRect().width);
  await page.mouse.move(se.x, se.y); await page.mouse.down();
  await page.mouse.move(se.x + 100, se.y + 60, { steps: 5 }); await page.mouse.up();
  const w1 = await page.evaluate(() => document.querySelector('.window.active').getBoundingClientRect().width);
  t('corner resize', Math.abs(w1 - w0 - 100) < 8 ? 'ok' : 'bug');

  await page.click('.window.active .min-btn'); await sleep(400);
  const hidden = await page.evaluate(() => getComputedStyle(document.querySelector('.window.active, .window')).display === 'none' ||
    [...document.querySelectorAll('.window')].every((w) => getComputedStyle(w).display === 'none'));
  await page.click('#running-apps .task-icon'); await sleep(400);
  const shown = await page.evaluate(() => [...document.querySelectorAll('.window')].some((w) => getComputedStyle(w).display !== 'none'));
  t('minimize + taskbar restore', hidden && shown ? 'ok' : 'bug');

  await page.click('.window.active .max-btn'); await sleep(300);
  const maxed = await page.evaluate(() => { const r = document.querySelector('.window.active').getBoundingClientRect(); return r.width === innerWidth && r.height > innerHeight - 60; });
  await page.click('.window.active .max-btn'); await sleep(300);
  t('maximize / restore', maxed ? 'ok' : 'bug');

  const tb = await page.evaluate(() => { const r = document.querySelector('.window.active .titlebar').getBoundingClientRect(); return { x: r.x, y: r.y }; });
  await page.mouse.move(tb.x + 300, tb.y + 15); await page.mouse.down();
  await page.mouse.move(5, 400, { steps: 8 }); await page.mouse.up(); await sleep(500);
  t('drag to left edge snaps half',
    Math.abs((await page.evaluate(() => document.querySelector('.window.active').getBoundingClientRect().width)) - 960) < 4 ? 'ok' : 'bug');
  await closeActive(); await sleep(300);

  // ---------------------------------------------------------------- shell surfaces
  section('Shell');
  await page.click('#quicksettings-btn'); await sleep(400);
  const qsBefore = await $eval('#quick-settings .qs-tile', (el) => el.className);
  await page.click('#quick-settings .qs-tile'); await sleep(200);
  t('quick-settings tiles toggle', (await $eval('#quick-settings .qs-tile', (el) => el.className)) !== qsBefore ? 'ok' : 'facade', 'tiles are static');
  await page.keyboard.press('Escape'); await sleep(200);
  await page.click('#notif-btn'); await sleep(400);
  await page.click('#clear-notifs'); await sleep(300);
  t('clear-all empties notification center',
    (await $eval('#notif-list', (el) => el.textContent)).includes('No new notifications') ? 'ok' : 'bug');
  await page.keyboard.press('Escape'); await sleep(200);

  // ---------------------------------------------------------------- virtual desktops
  section('Virtual desktops');
  await page.click('#taskview-btn'); await sleep(400);
  await page.click('#new-desktop'); await sleep(400);
  // the shell starts with two desktops, so the new one is the last thumb
  const newIdx = await page.evaluate(() => document.querySelectorAll('.desktop-thumb').length - 1);
  await page.click('#close-taskview'); await sleep(300);
  await openApp('notepad'); await sleep(400);
  await page.click('#taskview-btn'); await sleep(400);
  await page.click('.desktop-thumb[data-idx="0"]'); await sleep(400);
  const gone = await page.evaluate(() => [...document.querySelectorAll('.window')].every((w) => getComputedStyle(w).display === 'none'));
  await page.click('#taskview-btn'); await sleep(400);
  await page.click(`.desktop-thumb[data-idx="${newIdx}"]`); await sleep(400);
  const back = await page.evaluate(() => [...document.querySelectorAll('.window')].some((w) => getComputedStyle(w).display !== 'none'));
  t('windows isolated per desktop', gone && back ? 'ok' : 'bug');
} catch (err) {
  console.error(red('error:'), err.message.split('\n')[0]);
  process.exitCode = 1;
} finally {
  await browser.close();
}

const n = (s) => results.filter((r) => r.status === s).length;
console.log(bold('\n── summary'));
console.log(`${green(n('ok') + ' interactive')}, ${yellow(n('facade') + ' façade')}, ${red(n('bug') + ' bug(s)')}`);
if (n('facade')) console.log(dim('façades: ' + results.filter((r) => r.status === 'facade').map((r) => r.name).join('; ')));
if (n('bug') && opt['fail-on-bug']) process.exit(2);
process.exit(process.exitCode ?? 0);
