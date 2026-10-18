// Isolated demo API: exercises new outfit selection/cost/cache; no paid traffic.
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {MOCK_LISTINGS} from '../src/data/mockData.js';
const directory=await mkdtemp(path.join(tmpdir(),'sifit-outfit-ui-'));
const backend=spawn(process.execPath,['server/index.mjs'],{windowsHide:true,env:{...process.env,SIFIT_DATA_DIR:directory,SIFIT_API_PORT:'3017',TRYON_MODE:'demo',FASHN_API_KEY:'',GEMINI_API_KEY:''},stdio:'pipe'});
let vite,browser;const logs=[];backend.stderr.on('data',b=>logs.push(String(b)));
try{
 for(let i=0;i<60;i++){try{await fetch('http://127.0.0.1:3017/api/auth/session');break;}catch{await new Promise(r=>setTimeout(r,200));}}
 vite=await createServer({server:{port:5187,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:3017',changeOrigin:false,timeout:240000}}}});await vite.listen();
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1600,height:1100},baseURL:'http://localhost:5187'});const page=await context.newPage();page.setDefaultTimeout(25000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await context.request.post('/api/auth/login',{data:{email:'buyer@sifit.com',password:'123456'}});
 const selectedProducts=['men_15970','everyday_27614'].map(id=>MOCK_LISTINGS.find(p=>p._id===id));
 selectedProducts.push(...['Footwear','Accessories'].map(category=>MOCK_LISTINGS.find(p=>p.category===category&&p.images[0].startsWith('/images/catalog/'))));
 for(const id of selectedProducts.map(p=>p._id)){
  const p=MOCK_LISTINGS.find(p=>p._id===id);await page.goto('/?view=catalog');await page.getByRole('tab',{name:'Tất cả',exact:true}).click();
  await page.locator('.product-card').filter({hasText:p.title}).locator('.product-image-button').click();await page.getByRole('button',{name:'Thử đồ với AI',exact:true}).click();
 }
 await page.locator('#stylist-photo').setInputFiles({name:'sample.png',mimeType:'image/png',buffer:await readFile('artifacts/stylist/sample-person.png')});
 await page.getByRole('checkbox',{name:'Đồng ý điều khoản xử lý ảnh',exact:true}).check();await page.getByRole('button',{name:'Lưu ảnh',exact:true}).click();await expect(page.getByAltText('Người mẫu của bạn đã lưu')).toBeVisible();
 await page.getByLabel('Chất lượng thử đồ',{exact:true}).selectOption('outfit');
 if(await page.locator('.stylist-wardrobe .stylist-measurements').getAttribute('open')===null)await page.locator('.stylist-wardrobe .stylist-measurements summary').click();
 await page.getByRole('spinbutton',{name:'Chiều cao',exact:true}).fill('173');await page.getByRole('spinbutton',{name:'Cân nặng',exact:true}).fill('68');await page.getByRole('checkbox',{name:'Đồng ý điều khoản thử đồ AI',exact:true}).check();
 await page.locator('.stylist-product.selected').click();await page.getByRole('button',{name:'Thử đồ với AI',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Chọn ít nhất một món');
 for(const p of selectedProducts){await page.locator('.stylist-product').filter({hasText:p.title}).click();await expect(page.getByRole('checkbox',{name:`Chọn ${p.title}`,exact:true})).toBeChecked();}
 await expect(page.getByText('4 món đã chọn · 2 credit',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Thử đồ với AI',exact:true}).click();await expect(page.getByAltText('Kết quả thử đồ')).toBeVisible({timeout:15000});
 const state=(await(await context.request.get('/api/stylist/state')).json());expect(state.jobs[0].engine).toBe('outfit');expect(state.jobs[0].totalSteps).toBe(1);expect(state.jobs[0].productIds.length).toBe(4);expect(state.quota.dailyUsed).toBe(2);
 await expect(page.getByText('4 món đã chọn · 0 credit',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Xem lại kết quả',exact:true}).click();expect((await(await context.request.get('/api/stylist/state')).json()).quota.dailyUsed).toBe(2);
 await mkdir('artifacts/stylist',{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/stylist/outfit-ui-desktop.png',fullPage:true});
 await page.reload();await expect(page.getByLabel('Chất lượng thử đồ',{exact:true})).toHaveValue('outfit');await expect(page.getByText('4 món đã chọn · 0 credit',{exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/stylist/outfit-ui-mobile.png',fullPage:true});
 expect(errors).toEqual([]);console.log('PASS: experimental one-pass top/trousers, invalid selection feedback, two-credit total, one step, cache/reload/mobile. No paid calls.');
}finally{await browser?.close();await vite?.close();backend.kill();await new Promise(r=>backend.exitCode!=null?r():backend.once('exit',r));assertTestDirectory();await rm(directory,{recursive:true,force:true});if(logs.length)console.log(logs.join(''));}
function assertTestDirectory(){if(path.dirname(directory)!==path.resolve(tmpdir()))throw new Error('Unsafe cleanup');}
