import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {composeOutfitReference,supportsOutfit} from './outfitReference.mjs';
import {MOCK_LISTINGS} from '../src/data/mockData.js';
const items=['men_15970','everyday_27614'].map(id=>MOCK_LISTINGS.find(p=>p._id===id));
const directory=await mkdtemp(path.join(tmpdir(),'sifit-outfit-'));
process.env.SIFIT_DATA_DIR=directory;process.env.SIFIT_API_PORT='0';process.env.TRYON_MODE='live';process.env.FASHN_API_KEY='test-no-network';
const nativeFetch=globalThis.fetch,calls=[];let scenario='success';
globalThis.fetch=async(url,options)=>{
 if(!String(url).startsWith('https://api.fashn.ai/'))return nativeFetch(url,options);
 if(options?.method==='POST'){
  calls.push(JSON.parse(options.body));
  if(scenario==='reject')return Response.json({},{status:422});
  if(scenario==='unknown')throw new Error('Unknown submission state');
  return Response.json({id:randomUUID()});
 }
 const result=await sharp({create:{width:1024,height:1536,channels:3,background:'#dcbbaa'}}).png().toBuffer();
 return Response.json({status:'completed',output:[`data:image/png;base64,${result.toString('base64')}`]});
};
const {server}=await import('./index.mjs');await new Promise(r=>server.listening?r():server.once('listening',r));
const base=`http://127.0.0.1:${server.address().port}/api`;
after(async()=>{await new Promise(r=>server.close(r));globalThis.fetch=nativeFetch;assert.equal(path.dirname(directory),path.resolve(tmpdir()));await rm(directory,{recursive:true,force:true});});
async function request(route,cookie='',body){const r=await nativeFetch(base+route,{method:body?'POST':'GET',headers:{Cookie:cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json()};}
let cookie;
const input=()=>({engine:'outfit',productIds:items.map(p=>p._id),measurements:{height:173,weight:68},termsAccepted:true,requestId:randomUUID()});
async function poll(id){for(let i=0;i<80;i++){const {data}=await request('/stylist/jobs/'+id,cookie);if(['completed','failed'].includes(data.job.status))return data;await new Promise(r=>setTimeout(r,100));}throw new Error('Poll timed out');}
test('reference includes both uncropped original photos, keeps deterministic left/right placement; incompatible pair rejected',async()=>{
 assert.equal(supportsOutfit(items),true);assert.equal(supportsOutfit([items[0],items[0]]),false);
 const a=await composeOutfitReference(items),b=await composeOutfitReference([...items].reverse());
 assert.ok(a.equals(b),'selection order does not move the panels or invalidate cache');
 const meta=await sharp(a).metadata();assert.equal(meta.width,1608);assert.equal(meta.height,1200);
 const left=await sharp(await sharp(a).extract({left:24,top:48,width:768,height:1120}).toBuffer()).stats();
 const right=await sharp(await sharp(a).extract({left:816,top:48,width:768,height:1120}).toBuffer()).stats();
 assert.ok(left.channels[0].stdev>30);assert.ok(right.channels[0].stdev>30);
 const single=await sharp(await composeOutfitReference([items[0]])).metadata();assert.equal(single.width,816);
 await assert.rejects(composeOutfitReference([]));
});
test('one whole outfit makes exactly one Max submission; reserves two credits total, caches and deduplicates',async()=>{
 const login=await nativeFetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'buyer@sifit.com',password:'123456'})});cookie=login.headers.get('set-cookie').split(';')[0];
 const photo=await sharp({create:{width:768,height:1024,channels:3,background:'#abcabc'}}).png().toBuffer();
 const form=new FormData();form.append('photo',new Blob([photo],{type:'image/png'}),'sample.png');form.append('photoMode','original');form.append('termsAccepted','true');
 const draft=(await(await nativeFetch(base+'/stylist/model/preview',{method:'POST',headers:{Cookie:cookie},body:form})).json()).draft;await request('/stylist/model/confirm',cookie,{id:draft.id});
 for(const productIds of [[],[items[0]._id,items[0]._id],['missing-product']])assert.equal((await request('/stylist/tryon',cookie,{...input(),productIds})).status,400);
 assert.equal(calls.length,0);
 const body=input(),start=await request('/stylist/tryon',cookie,body);assert.equal(start.status,202);assert.equal(start.data.job.cost,2);assert.equal(start.data.job.totalSteps,1);assert.equal(start.data.job.productIds.length,2);
 assert.equal((await request('/stylist/tryon',cookie,body)).data.job.id,start.data.job.id);
 const done=await poll(start.data.job.id);assert.equal(done.job.status,'completed');assert.equal(done.quota.dailyUsed,2);assert.equal(calls.length,1);
 assert.equal(calls[0].model_name,'tryon-max');assert.equal(calls[0].inputs.num_images,1);assert.equal(calls[0].inputs.generation_mode,'balanced');assert.match(calls[0].inputs.prompt,/ALL 2 items/);
 assert.match(calls[0].inputs.product_image,/^data:image\/jpeg;base64,/);
 const reference=Buffer.from(calls[0].inputs.product_image.split(',')[1],'base64');assert.ok(reference.equals(await composeOutfitReference(items)));
 const cached=await request('/stylist/tryon',cookie,{...input(),productIds:[...body.productIds].reverse()});assert.equal(cached.data.cached,true);assert.equal(calls.length,1);
 scenario='reject';const failed=await request('/stylist/tryon',cookie,{...input(),regenerate:true});const rejected=await poll(failed.data.job.id);assert.equal(rejected.job.status,'failed');assert.equal(rejected.quota.dailyUsed,2);assert.equal(calls.length,2,'no automatic retry or second garment request');
 scenario='unknown';const uncertain=await request('/stylist/tryon',cookie,{...input(),regenerate:true});const held=await poll(uncertain.data.job.id);assert.equal(held.job.status,'failed');assert.equal(held.quota.dailyUsed,4);assert.equal(calls.length,3);
});
test('reference preparation failure refunds both reservations without submitting to FASHN',async()=>{
 await request('/stylist/credits/reset',cookie,{});scenario='success';
 const original=items[0].images;
 items[0].images=['/images/catalog/does-not-exist-test.webp'];
 try{const start=await request('/stylist/tryon',cookie,{...input(),regenerate:true});const done=await poll(start.data.job.id);assert.equal(done.job.status,'failed');assert.equal(done.quota.dailyUsed,0);assert.equal(calls.length,3);}
 finally{items[0].images=original;}
});

test('three/four category combinations use a single submission at two credits; no shirt/trousers pair required',async()=>{
 await request('/stylist/credits/reset',cookie,{});scenario='success';
 const shoes=MOCK_LISTINGS.find(p=>p.category==='Footwear'&&p.images[0].startsWith('/images/catalog/'));
 const bag=MOCK_LISTINGS.find(p=>p.category==='Accessories'&&p.images[0].startsWith('/images/catalog/'));
 const jacket=MOCK_LISTINGS.find(p=>p.category==='Outerwear'&&p.images[0].startsWith('/images/catalog/'));
 const four=[...items,shoes,bag],before=calls.length;
 for(const products of [[shoes,bag,jacket],four]){
  const reference=await composeOutfitReference(products);const meta=await sharp(reference).metadata();assert.equal(meta.width,1608);assert.equal(meta.height,2376);
  const started=await request('/stylist/tryon',cookie,{...input(),productIds:products.map(p=>p._id)});assert.equal(started.status,202);
  const done=await poll(started.data.job.id);assert.equal(done.job.status,'completed');assert.equal(done.job.cost,2);assert.equal(done.job.totalSteps,1);assert.equal(done.job.productIds.length,products.length);
  assert.match(calls.at(-1).inputs.prompt,new RegExp('ALL '+products.length+' items'));assert.equal(calls.at(-1).inputs.num_images,1);
 }
 assert.equal(calls.length-before,2,'one request for each whole collage');
 const invalid=await request('/stylist/tryon',cookie,{...input(),productIds:[...four,jacket].map(p=>p._id)});assert.equal(invalid.status,400);
 const normal=await request('/stylist/tryon',cookie,{...input(),engine:'v1.6',productIds:four.map(p=>p._id)});assert.equal(normal.status,400);assert.equal(calls.length-before,2);
 const reused=await request('/stylist/tryon',cookie,{...input(),productIds:[...four].reverse().map(p=>p._id)});assert.equal(reused.data.cached,true);assert.equal(calls.length-before,2);
});
