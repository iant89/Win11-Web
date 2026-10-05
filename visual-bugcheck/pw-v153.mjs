import { chromium } from 'playwright-core';
const BIN = '/home/user/.chrome153/package/bin/chromium';
const browser = await chromium.launch({
  executablePath: BIN,
  args: ['--no-sandbox','--no-zygote','--disable-dev-shm-usage','--disable-gpu','--font-render-hinting=none','--force-color-profile=srgb'],
});
const page = await browser.newPage({ viewport: { width: 800, height: 300 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('crash', () => console.log('[CRASH]'));
await page.goto('http://localhost:5173/ct-i1.html', { timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: 'visual-bugcheck/shots/i1.png' });
console.log('input OK');
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(4000);
await page.setViewportSize({ width: 1920, height: 1080 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'visual-bugcheck/shots/00-desktop.png' });
console.log('desktop OK');
await browser.close();
