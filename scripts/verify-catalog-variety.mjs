// Standalone temporary frontend; all API calls are blocked, no AI credits used.
import { chromium, expect } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { importedCatalog } from '../src/data/importedCatalog.js';
import variety from '../src/data/varietyCatalog.json' with { type: 'json' };
import { matchesCategory } from '../src/data/categories.js';

const vite=await createServer({server:{port:5191,strictPort:true}});await vite.listen();let browser;
try{
  expect(variety.length).toBe(120);
  expect(importedCatalog.filter(p=>p.source?.articleType==='Tshirts').length).toBe(42);
  expect(new Set(importedCatalog.map(p=>p._id)).size).toBe(importedCatalog.length);
  for(const p of variety)await access(path.resolve('public'+p.images[0]));
  for(const category of ['tops','jackets','knitwear','jeans','dresses','skirts','bags'])expect(variety.some(p=>matchesCategory(p,category))).toBe(true);
  const newest=[...importedCatalog].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,16);
  expect(new Set(newest.map(p=>p.source?.articleType)).size).toBeGreaterThanOrEqual(7);
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1600,height:1000},baseURL:'http://localhost:5191'});
  await context.route('**/api/**',route=>route.fulfill({status:401,json:{error:'Isolated public catalog check'}}));
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?view=catalog');await expect(page.locator('.product-card').first()).toBeVisible();
  await expect(page.locator('.product-card').first()).toContainText('Áo sơ mi');
  await page.locator('.product-card').first().locator('img').evaluate(img=>img.decode());
  await mkdir('artifacts/stylist',{recursive:true});await page.screenshot({path:'artifacts/stylist/catalog-variety-desktop.png',fullPage:false});
  await page.getByRole('tab',{name:'Thời trang nam',exact:true}).click();await expect(page.locator('.product-card').filter({hasText:'Váy liền nữ'})).toHaveCount(0);
  for(const kind of ['Áo len nam','Áo khoác nam','Quần jeans nam'])await expect(page.locator('.product-card').filter({hasText:kind}).first()).toBeVisible();
  await page.getByRole('tab',{name:'Thời trang nữ',exact:true}).click();for(const kind of ['Váy liền nữ','Chân váy nữ','Túi xách nữ'])await expect(page.locator('.product-card').filter({hasText:kind}).first()).toBeVisible();
  const dress=variety.find(p=>p.source.articleType==='Dresses');await page.locator('.product-card').filter({hasText:dress.title}).locator('.product-image-button').click();await expect(page.getByRole('button',{name:'Thử đồ với AI',exact:true})).toBeVisible();
  await page.goto('/?view=catalog');await page.setViewportSize({width:390,height:844});await page.getByRole('tab',{name:'Tất cả',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'artifacts/stylist/catalog-variety-mobile.png',fullPage:false});
  expect(errors).toEqual([]);console.log('PASS: 42 retailer T-shirts, 120 new varied styles, all files unique/present, balanced first page, gender/category/detail controls, desktop/mobile. No API calls.');
}finally{await browser?.close();await vite.close();}
