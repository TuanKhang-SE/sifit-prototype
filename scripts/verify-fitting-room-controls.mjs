import { chromium, expect } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir } from 'node:fs/promises';
import { MOCK_LISTINGS } from '../src/data/mockData.js';

// UI contract checks with isolated HTTP fixtures: no provider requests or credits.
const vite = await createServer({ server: { port: 5187, strictPort: true } });
await vite.listen();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
  const product = MOCK_LISTINGS.find(p => p._id === 'local_04');
  await context.addInitScript(id => localStorage.setItem('sifit-cart-fixture-user', JSON.stringify([id])), product._id);
  let profile = null, calls = 0;
  const measurements = {};
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let body = {};
    if (url.pathname.endsWith('/auth/session')) body = { user: { _id: 'fixture-user', name: 'Test', role: 'buyer' } };
    if (url.pathname.endsWith('/stylist/state')) body = { profile, measurements, jobs: [], stylePreference: 'all', geminiReady: true, ready: true, mode: 'live', quota: { remaining: 5, dailyUsed: 0, monthlyUsed: 0 } };
    if (url.pathname.endsWith('/stylist/history')) body = { jobs: [], total: 0, page: 1, pages: 1 };
    if (url.pathname.endsWith('/stylist/recommendations')) { calls++; body = { outfits: [], photoAnalyzed: true, observation: 'Đã đọc ảnh.' }; }
    await route.fulfill({ json: body });
  });
  await page.goto('http://localhost:5187/?view=ai-stylist');
  await expect(page.locator('.stylist-upload-guide')).toContainText('lộ tay, chân');
  await expect(page.getByRole('spinbutton', { name: 'Chiều cao', exact: true })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Cân nặng', exact: true })).toHaveAttribute('required', '');
  await expect(page.getByRole('spinbutton', { name: 'Vòng eo', exact: true })).not.toHaveAttribute('required', '');
  await page.getByRole('button', { name: `Xóa ${product.title} khỏi giỏ`, exact: true }).click();
  await expect(page.locator('.stylist-product')).toHaveCount(0);
  await page.getByRole('tab', { name: 'AI gợi ý', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Thử đồ với AI', exact: true })).toHaveCount(0);
  const suggest = page.getByRole('button', { name: 'Gợi ý', exact: true });
  await expect(suggest).toBeDisabled();
  expect(calls).toBe(0);
  profile = { id: 'fixture-photo', composition: 'white-plinth-v1', hideFace: false };
  await page.reload();
  await page.getByRole('tab', { name: 'AI gợi ý', exact: true }).click();
  await suggest.click();
  await expect(page.getByRole('alert')).toContainText('chiều cao và cân nặng');
  expect(calls).toBe(0);
  await page.getByRole('spinbutton', { name: 'Chiều cao', exact: true }).fill('173');
  await page.getByRole('spinbutton', { name: 'Cân nặng', exact: true }).fill('68');
  await page.getByRole('checkbox', { name: 'Đồng ý dùng ảnh và số đo cho Sifit', exact: true }).check();
  const input = await page.getByRole('textbox', { name: 'Phong cách muốn thử' }).boundingBox();
  const button = await suggest.boundingBox();
  expect(button.y).toBeGreaterThan(input.y + input.height);
  expect(button.width).toBeGreaterThan(500);
  await suggest.click();
  await expect(page.locator('.stylist-rec-analysis')).toContainText('Đã đọc ảnh');
  expect(calls).toBe(1);
  expect(await page.locator('.stylist-page').evaluate(e => getComputedStyle(e).zoom)).toBe('0.9');
  await mkdir('artifacts/stylist', { recursive: true });
  await page.screenshot({ path: 'artifacts/stylist/compact-controls-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/stylist/compact-controls-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
  console.log('PASS: cart removal, photo prerequisite, required height/weight, optional circumferences, cart-only try-on, large suggestion button below input, 90% scale, mobile layout.');
} finally { await browser?.close(); await vite.close(); }
