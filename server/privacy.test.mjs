import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { blurFace } from './faceBlur.mjs';
const directory = await mkdtemp(path.join(tmpdir(), 'sifit-privacy-'));
process.env.SIFIT_DATA_DIR = directory; process.env.SIFIT_API_PORT = '0'; process.env.TRYON_MODE = 'demo';
const { server } = await import('./index.mjs');
await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(async () => { await new Promise(resolve => server.close(resolve)); assert.equal(path.dirname(directory), path.resolve(tmpdir())); await rm(directory, { recursive: true, force: true }); });
async function login(email) { const r = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: '123456' }) }); return r.headers.get('set-cookie').split(';')[0]; }
async function request(route, cookie, body, method='POST') { return fetch(base+route, { method, headers: { Cookie: cookie, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(route === '/stylist/tryon' ? { measurements: {height:173,weight:68}, ...body } : body) } : {}) }); }

test('blur reduces facial detail, leaves body/background untouched, preserves native resolution', async () => {
  const svg = `<svg width="500" height="750"><rect width="500" height="750" fill="#be8254"/>${Array.from({length:40},(_,i)=>`<rect x="${150+i*5}" y="80" width="2" height="140" fill="${i%2?'black':'white'}"/>`).join('')}</svg>`;
  const original = await sharp(Buffer.from(svg)).png().toBuffer(), box = {x:.3,y:80/750,width:.4,height:140/750};
  const output = await blurFace(original,box);
  assert.equal((await sharp(output).metadata()).width,500);
  const patch = {left:190,top:110,width:120,height:60};
  const before = await sharp(await sharp(original).extract(patch).toBuffer()).stats(), after = await sharp(await sharp(output).extract(patch).toBuffer()).stats();
  assert.ok(after.channels[0].stdev < before.channels[0].stdev/4);
  const outside = {left:20,top:300,width:460,height:400};
  assert.ok((await sharp(output).extract(outside).removeAlpha().raw().toBuffer()).equals(await sharp(original).extract(outside).removeAlpha().raw().toBuffer()), 'pixels outside the face stay unchanged');
});
test('measurements/style persist independently; saved portrait and completed result privacy toggle is reversible and owner-only', async () => {
  const cookie=await login('buyer@sifit.com'), other=await login('buyer2@sifit.com');
  const info={height:'173',weight:'68',bust:'94',waist:'78',hips:'96'};
  assert.equal((await request('/stylist/measurements',cookie,{measurements:info,stylePreference:'men'},'PUT')).status,200);
  const readState=async()=> (await (await request('/stylist/state',cookie,null,'GET')).json());
  assert.deepEqual((await readState()).measurements,{height:173,weight:68,bust:94,waist:78,hips:96});
  assert.equal((await readState()).stylePreference,'men');
  assert.equal((await request('/stylist/measurements',cookie,{measurements:{height:999}},'PUT')).status,400);
  const photo = await sharp(Buffer.from('<svg width="500" height="750"><rect width="500" height="750" fill="#be8254"/><path d="M180 70h140v80H180z" fill="black"/><circle cx="220" cy="100" r="20" fill="white"/></svg>')).png().toBuffer();
  const form=new FormData();form.append('photo',new Blob([photo],{type:'image/png'}),'portrait.png');form.append('photoMode','original');form.append('termsAccepted','true');
  const draft=(await (await fetch(base+'/stylist/model/preview',{method:'POST',headers:{Cookie:cookie},body:form})).json()).draft;
  await request('/stylist/model/confirm',cookie,{id:draft.id});
  const raw = await readFile(path.join(directory,`${draft.id}.png`));
  const box={x:.35,y:.08,width:.3,height:.15};
  const toggle=async(id,hideFace)=>request(`/stylist/images/${id}/privacy`,cookie,{hideFace,faceBox:box},'PATCH');
  assert.equal((await toggle(draft.id,true)).status,200);
  const image=async(id,owner=cookie)=>fetch(`${base}/stylist/images/${id}`,{headers:{Cookie:owner}});
  const hidden=Buffer.from(await (await image(draft.id)).arrayBuffer());
  assert.notDeepEqual(hidden,raw);assert.deepEqual(hidden,await blurFace(raw,box));
  assert.equal((await image(draft.id,other)).status,404);
  assert.equal((await request(`/stylist/images/${draft.id}/privacy`,other,{hideFace:false},'PATCH')).status,404);
  await toggle(draft.id,false);
  assert.deepEqual(Buffer.from(await (await image(draft.id)).arrayBuffer()),await blurFace(raw,null));
  const {MOCK_LISTINGS}=await import('../src/data/mockData.js');
  const product=MOCK_LISTINGS.find(p=>p.status==='active'&&p.category==='Tops');
  const next=await request('/stylist/tryon',cookie,{productIds:[product._id],requestId:crypto.randomUUID(),termsAccepted:true});
  const {job}=await next.json();let result;
  for(let i=0;i<40;i++){result=(await (await request(`/stylist/jobs/${job.id}`,cookie,null,'GET')).json()).job;if(result.status==='completed')break;await new Promise(resolve=>setTimeout(resolve,100));}
  assert.equal(result.status,'completed');
  assert.equal((await toggle(result.imageId,true)).status,200);
  assert.equal((await readState()).quota.dailyUsed,1,'only the demo try-on used allowance');
  await toggle(result.imageId,false);
  assert.deepEqual(Buffer.from(await (await image(result.imageId)).arrayBuffer()),await blurFace(raw,null));
});
