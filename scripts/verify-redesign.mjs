import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.SIFIT_TEST_URL || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ channel: process.env.SIFIT_BROWSER_CHANNEL || 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
await page.emulateMedia({ reducedMotion: 'reduce' });
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('artifacts/redesign', { recursive: true });

try {
  await page.goto(baseURL);
  await expect(page.getByRole('heading', { name: 'cho đồ đẹp một cuộc đời mới.' })).toBeVisible();
  await page.getByLabel('Ngôn ngữ', { exact: true }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'give good clothes another life.' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/redesign/home-desktop.png', fullPage: true });
  await page.evaluate(() => window.scrollTo(0, 1000));
  expect(await page.locator('.store-header').evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(0);
  await page.locator('.category-item').filter({ hasText: 'Jeans' }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-title')).toContainText('Jeans');
  await page.getByRole('button', { name: 'Sifit — Home', exact: true }).click();
  await page.locator('.search-chips').getByRole('button', { name: 'wool' }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-title')).toContainText('Wool');
  await page.locator('.account-actions').getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.locator('#demo-logins')).toHaveCount(0);
  await page.screenshot({ path: 'artifacts/redesign/login-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'More options to log in', exact: false }).click();
  await expect(page.locator('#demo-logins')).toBeVisible();
  await expect(page.locator('#demo-logins button')).toHaveCount(3);
  await page.getByRole('button', { name: 'More options to log in', exact: false }).click();
  await expect(page.locator('#demo-logins')).toHaveCount(0);
  await page.getByLabel('Email', { exact: true }).fill('buyer@sifit.com');
  await page.getByLabel('Password', { exact: true }).fill('bad-password');
  await page.getByLabel('Language', { exact: true }).selectOption('vi');
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('bad-password');
  await page.getByLabel('Ngôn ngữ', { exact: true }).selectOption('en');
  await page.locator('.auth-submit').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('123456');
  await page.locator('.auth-submit').click();
  await expect(page.locator('.editorial-home')).toBeVisible();
  await page.getByRole('button', { name: 'Shopping bag', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Shopping bag', exact: true }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Account', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sifit — Home', exact: true }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.locator('.signup-link').click();
  await expect(page.getByRole('button', { name: 'Sign up with email', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign up with email', exact: true }).click();
  await page.getByLabel('Full name', { exact: true }).fill('Sifit Test');
  await page.getByLabel('Email', { exact: true }).fill('test-redesign@sifit.example');
  await page.getByLabel('Password', { exact: true }).fill('123456');
  await page.locator('.auth-submit').click();
  await expect(page.locator('.editorial-home')).toBeVisible();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  for (const [role, heading] of [['Seller', 'seller'], ['Admin', 'admin']]) {
    await page.locator('.account-actions').getByRole('button', { name: 'Log in', exact: true }).click();
    await page.getByRole('button', { name: 'More options to log in', exact: false }).click();
    await page.locator('#demo-logins').getByRole('button', { name: new RegExp(role) }).click();
    await expect(page).toHaveURL(new RegExp(`view=${heading}`));
    await expect(page.getByRole('button', { name: 'Overview', exact: true }).first()).toBeVisible();
    if (role === 'Seller') {
      await page.screenshot({ path: 'artifacts/redesign/seller-desktop.png', fullPage: true });
      await page.getByRole('button', { name: 'Publish listing', exact: true }).first().click();
      await expect(page.getByRole('heading', { name: 'Create a listing', exact: true })).toBeVisible();
      await page.locator('select').filter({ has: page.locator('option[value="Tops"]') }).selectOption('Bottoms');
      await expect(page.locator('select').filter({ has: page.locator('option[value="Tops"]') })).toHaveValue('Bottoms');
      await page.getByLabel('Language', { exact: true }).selectOption('vi');
      await expect(page.locator('select').filter({ has: page.locator('option[value="Tops"]') })).toHaveValue('Bottoms');
      await page.getByLabel('Ngôn ngữ', { exact: true }).selectOption('en');
    }
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /sifit-logo/);
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(baseURL);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 390) await page.screenshot({ path: 'artifacts/redesign/home-mobile.png', fullPage: true });
    await page.locator('.signup-link').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator('#demo-logins')).toHaveCount(0);
    if (width === 390) await page.screenshot({ path: 'artifacts/redesign/signup-mobile.png', fullPage: true });
  }
  expect(errors).toEqual([]);
  console.log('PASS: homepage, sticky header, categories/materials, locale persistence, auth, registration, three demo roles, and 320/390/768px layouts.');
} catch (error) {
  console.error(await page.locator('main.flex-grow').ariaSnapshot().catch(() => 'Unable to read screen'));
  throw error;
} finally {
  await browser.close();
}
