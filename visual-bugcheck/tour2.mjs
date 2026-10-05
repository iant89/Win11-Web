import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/home/user/.chrome153/package/bin/chromium',
  args: ['--no-sandbox','--no-zygote','--disable-dev-shm-usage','--disable-gpu','--font-render-hinting=none','--force-color-profile=srgb'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(3000);
// toast via brightness slider
await page.click('#quicksettings-btn'); await page.waitForTimeout(500);
await page.fill('#brightness', '90'); await page.waitForTimeout(400);
await page.screenshot({ path: 'visual-bugcheck/shots/20-toast.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
// small viewport
await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(600);
await page.screenshot({ path: 'visual-bugcheck/shots/21-small-desktop.png' });
await page.click('#start-btn'); await page.waitForTimeout(600);
await page.screenshot({ path: 'visual-bugcheck/shots/22-small-start.png' });
console.log('TOUR2 DONE');
await browser.close();
