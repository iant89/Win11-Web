import { chromium } from 'playwright-core';

const BIN = process.env.CHROME_BIN || '/home/user/.chrome153/package/bin/chromium';
const OUT = 'visual-bugcheck/shots/';
const notes = [];

const browser = await chromium.launch({
  executablePath: BIN,
  args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu',
         '--font-render-hinting=none', '--force-color-profile=srgb'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => notes.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') notes.push('CONSOLE: ' + m.text().slice(0, 120)); });
page.on('crash', () => notes.push('CRASH'));

const shot = (name) => page.screenshot({ path: OUT + name + '.png' });
const sleep = (ms) => page.waitForTimeout(ms);

await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(500);
await shot('01-boot');
await sleep(2800); // boot done + demo windows opened
await shot('02-desktop');

// Start menu
await page.click('#start-btn'); await sleep(600);
await shot('03-start-menu');
await page.fill('#start-search', 'term'); await sleep(400);
await shot('04-start-search');
await page.fill('#start-search', ''); await sleep(200);
await page.keyboard.press('Escape'); await sleep(300);

// Widgets
await page.click('#widgets-btn'); await sleep(600);
await shot('05-widgets');
await page.keyboard.press('Escape'); await sleep(300);

// Quick settings
await page.click('#quicksettings-btn'); await sleep(600);
await shot('06-quick-settings');
await page.keyboard.press('Escape'); await sleep(300);

// Notification center
await page.click('#notif-btn'); await sleep(600);
await shot('07-notifications');
await page.keyboard.press('Escape'); await sleep(300);

// Task view
await page.click('#taskview-btn'); await sleep(600);
await shot('08-taskview');
await page.click('#close-taskview'); await sleep(300);

// Desktop context menu
await page.mouse.click(1500, 800, { button: 'right' }); await sleep(400);
await shot('09-context-menu');
await page.keyboard.press('Escape'); await sleep(300);

// Close demo windows for clean app shots
await page.evaluate(() => document.querySelectorAll('.window .close').forEach(b => b.click()));
await sleep(500);

// Apps
await page.evaluate(() => window._openApp('store')); await sleep(700);
await shot('10-store');
await page.evaluate(() => document.querySelectorAll('.window .close').forEach(b => b.click())); await sleep(400);

await page.evaluate(() => window._openApp('notepad')); await sleep(500);
await shot('11-notepad');
await page.evaluate(() => document.querySelectorAll('.window .close').forEach(b => b.click())); await sleep(400);

await page.evaluate(() => window._openApp('calculator')); await sleep(500);
await shot('12-calculator');
// calculator interaction
await page.click('.calc button[data-c="7"]'); await page.click('.calc button[data-c="+"]');
await page.click('.calc button[data-c="5"]'); await page.click('.calc button[data-c="="]');
await sleep(300);
await shot('12b-calc-result');
await page.evaluate(() => document.querySelectorAll('.window .close').forEach(b => b.click())); await sleep(400);

await page.evaluate(() => window._openApp('settings')); await sleep(500);
await shot('13-settings');
await page.evaluate(() => document.querySelectorAll('.window .close').forEach(b => b.click())); await sleep(400);

await page.evaluate(() => window._openApp('vscode')); await sleep(500);
await shot('14-vscode');
await page.evaluate(() => document.querySelectorAll('.window .close').forEach(b => b.click())); await sleep(400);

await page.evaluate(() => window._openApp('photos')); await sleep(500);
await shot('15-photos');
await page.evaluate(() => document.querySelectorAll('.window .close').forEach(b => b.click())); await sleep(400);

// Explorer list view
await page.evaluate(() => window._openApp('explorer', { path: 'Documents' })); await sleep(600);
await shot('16-explorer-grid');
await page.click('.window [data-view="list"]'); await sleep(400);
await shot('16b-explorer-list');

// Snap popup hover on maximize
await page.hover('.window .max-btn'); await sleep(500);
await shot('17-snap-popup');

// Maximize
await page.click('.window .max-btn'); await sleep(500);
await shot('18-maximized');
await page.click('.window .max-btn'); await sleep(400);

// Snap two windows (halves)
await page.evaluate(() => window._openApp('notepad')); await sleep(500);
await page.hover('.window.active .max-btn'); await sleep(400);
await page.click('.window.active .snap-option[data-layout="halves"]'); await sleep(600);
await shot('19-snap-halves');
await page.evaluate(() => document.querySelectorAll('.window .close').forEach(b => b.click())); await sleep(400);

// Toasts
await page.evaluate(() => window.toast('Test toast', 'This is a toast message', '#0078D4', '✓'));
await sleep(400);
await shot('20-toast');
await sleep(3500);

// Small viewport overflow check
await page.setViewportSize({ width: 1280, height: 720 }); await sleep(600);
await shot('21-small-desktop');
await page.click('#start-btn'); await sleep(600);
await shot('22-small-start');

await browser.close();
console.log('TOUR DONE');
if (notes.length) { console.log('NOTES:'); notes.forEach(n => console.log(' -', n)); }
