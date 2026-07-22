const { createRequire } = require('module');
const req = createRequire('C:/Users/ROG/Desktop/auticare/auticare/apps/web/package.json');
const { chromium } = req('@playwright/test');
const path = require('path');
const OUT = process.env.SHOT_DIR;
const BASE = 'http://localhost:4200';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  await context.request.post(`${BASE}/api/v1/auth/login`, {
    data: { email: 'demo.parent@auticare.local', password: 'AutiCareDemoPassword123' },
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));

  // History: mix of v2 percentages and legacy fractions, plus pagination (6 sessions, page size 5)
  await page.goto(`${BASE}/screening/history`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('history scores:', await page.locator('.hc-score').allInnerTexts().catch(() => []));
  console.log('history badges:', await page.locator('ac-screening-badge').allInnerTexts().catch(() => []));
  console.log('pagination present:', await page.locator('ac-screening-pagination').count());
  await page.screenshot({ path: path.join(OUT, 'scoring-history.png'), fullPage: true });

  // Open the first result (100% High) via View details
  await page.locator('.hc-link', { hasText: 'View details' }).first().click();
  await page.waitForURL(/\/screening\/result\/.+/, { timeout: 10000 });
  await page.waitForTimeout(800);
  console.log('result score display:', await page.locator('.score').innerText().catch(() => '(none)'));
  console.log('result badge:', await page.locator('ac-screening-badge').innerText().catch(() => '(none)'));
  console.log('heuristic note present:', await page.locator('.heuristic-note').count());
  await page.screenshot({ path: path.join(OUT, 'scoring-result.png'), fullPage: true });

  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error('SCRIPT FAILED:', e); process.exit(1); });
