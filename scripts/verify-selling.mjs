import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.SIFIT_TEST_URL || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ channel: process.env.SIFIT_BROWSER_CHANNEL || 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(8000);
await page.emulateMedia({ reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('artifacts/redesign', { recursive: true });
try {
  await page.goto(baseURL);
  await page.getByLabel('Ngôn ngữ', { exact: true }).selectOption('en');
  const logo = page.locator('.brand-logo');
  await expect(logo.locator('img')).toHaveAttribute('src', /Sifit-nobg/);
  const bounds = await logo.boundingBox();
  expect(Math.abs(bounds.x + bounds.width / 2 - 720)).toBeLessThan(2);
  await page.locator('.shop-sell').getByRole('button', { name: 'SELL', exact: true }).click();
  await expect(page).toHaveURL(/view=sell$/);
  await expect(page.getByRole('heading', { name: 'Sell On Your Terms', exact: true })).toBeVisible();
  await expect(page.locator('.auth-page')).toHaveCount(0);
  await expect(page.locator('.selling-option')).toHaveCount(2);
  expect(await page.locator('.selling-option img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: 'artifacts/redesign/ways-to-sell-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'TRY DIRECT LISTING' }).click();
  await page.getByLabel('Piece name', { exact: true }).fill('My linen blazer');
  await page.getByLabel('Selling price (VND)', { exact: true }).fill('400000');
  await page.getByLabel('Tell its story', { exact: true }).fill('Size M, good condition, tiny mark on the cuff.');
  await page.getByRole('button', { name: 'SAVE MY DRAFT' }).click();
  await expect(page.locator('.listing-draft [role="status"]')).toContainText('saved on this device');
  await page.reload();
  await page.getByRole('button', { name: 'TRY DIRECT LISTING' }).click();
  await expect(page.getByLabel('Piece name', { exact: true })).toHaveValue('My linen blazer');
  await page.locator('.sell-navigation').getByRole('button', { name: 'Clean Out Guide', exact: true }).click();
  await expect(page).toHaveURL(/view=sell-guide$/);
  await expect(page.locator('.guide-section')).toHaveCount(4);
  await page.screenshot({ path: 'artifacts/redesign/cleanout-guide-desktop.png', fullPage: true });
  for (const [id, name] of [['earnings', 'Earnings'], ['what-to-expect', 'What to Expect'], ['faqs', 'FAQs'], ['what-to-send', 'What to Send']]) {
    await page.locator('.guide-sidebar').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`view=sell-guide#${id}$`));
    await expect(page.locator(`.guide-sidebar a[href$="#${id}"]`)).toHaveAttribute('aria-current', 'location');
    const top = await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top);
    const headerHeight = await page.locator('.store-header').evaluate(el => el.getBoundingClientRect().height);
    expect(top).toBeGreaterThanOrEqual(headerHeight - 2);
  }
  await page.locator('#earnings').evaluate(el => el.scrollIntoView());
  await expect(page.locator('.guide-sidebar a[href$="#earnings"]')).toHaveAttribute('aria-current', 'location');
  await page.getByLabel('Selling price (VND)', { exact: true }).fill('1000000');
  await expect(page.locator('.earnings-total dd')).toContainText('930,000');
  await page.locator('.guide-sidebar').getByRole('link', { name: 'FAQs', exact: true }).click();
  await page.getByRole('button', { name: 'Do I need an account to explore selling?', exact: true }).click();
  await expect(page.locator('#faq-answer-1')).toBeVisible();
  await page.getByRole('button', { name: 'Do I need an account to explore selling?', exact: true }).click();
  await expect(page.locator('#faq-answer-1')).toBeHidden();
  await page.locator('.newsletter-form input').fill('selling-test@sifit.example');
  await page.locator('.newsletter-form button').click();
  await expect(page.locator('.footer-form-feedback')).toContainText('saved on this device');
  await page.locator('.marketplace-footer-bottom').getByRole('button', { name: 'Your Privacy Choices', exact: true }).click();
  await page.getByRole('button', { name: 'REMOVE SAVED EMAIL', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('sifit-newsletter-email'))).toBeNull();
  await page.goto(`${baseURL}/?view=sell-guide#earnings`);
  await expect(page.locator('.guide-sidebar a[href$="#earnings"]')).toHaveAttribute('aria-current', 'location');
  await page.getByLabel('Language', { exact: true }).selectOption('vi');
  await expect(page.getByRole('heading', { name: 'Thu nhập', exact: true })).toBeVisible();
  await page.getByLabel('Ngôn ngữ', { exact: true }).selectOption('en');
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const view of ['sell', 'sell-guide']) {
      await page.goto(`${baseURL}/?view=${view}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390) await page.screenshot({ path: `artifacts/redesign/${view}-mobile.png`, fullPage: true });
      if (view === 'sell-guide') {
        await page.locator('.guide-sidebar').getByRole('link', { name: 'Earnings', exact: true }).click();
        await expect(page.locator('.guide-sidebar a[href$="#earnings"]')).toHaveAttribute('aria-current', 'location');
      }
    }
  }
  expect(errors).toEqual([]);
  console.log('PASS: centred transparent logo, public SELL, draft persistence, guide anchors/scrollspy, earnings, FAQs, footer/privacy, i18n and responsive layouts.');
} catch (error) {
  await page.screenshot({ path: 'artifacts/redesign/selling-failure.png', fullPage: true });
  throw error;
} finally { await browser.close(); }
