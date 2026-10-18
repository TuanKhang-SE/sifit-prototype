import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { quota, canReserve, periods } from './quota.mjs';
import { providerInputs, tryonSettings } from './tryonSettings.mjs';
import { rankRecommendations } from './recommendations.mjs';
import { MOCK_LISTINGS } from '../src/data/mockData.js';

const directory = await mkdtemp(path.join(tmpdir(), 'sifit-workflow-test-'));
process.env.SIFIT_DATA_DIR = directory; process.env.SIFIT_API_PORT = '0';
process.env.TRYON_MODE = 'live'; process.env.FASHN_API_KEY = 'test-no-network';
const realFetch = globalThis.fetch, calls = []; let reject = false;
globalThis.fetch = async (url, options) => {
  if (!String(url).startsWith('https://api.fashn.ai/')) return realFetch(url, options);
  if (options?.method === 'POST') {
    calls.push(JSON.parse(options.body));
    if (reject) return Response.json({}, { status: 422 });
    return Response.json({ id: randomUUID() });
  }
  const image = await sharp({ create: { width: 1024, height: 1536, channels: 3, background: '#dabbaa' } }).png().toBuffer();
  return Response.json({ status: 'completed', output: [`data:image/png;base64,${image.toString('base64')}`] });
};
const { server } = await import('./index.mjs'); const { db } = await import('./store.mjs');
await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(async () => { await new Promise(resolve => server.close(resolve)); globalThis.fetch = realFetch; assert.equal(path.dirname(directory), path.resolve(tmpdir())); await rm(directory, { recursive: true, force: true }); });
async function request(route, cookie = '', body) { return realFetch(base + route, { method: body ? 'POST' : 'GET', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(route === '/stylist/tryon' ? { measurements: {height:173,weight:68}, ...body } : body) } : {}) }); }
let cookie;
test('reset live allowance preserves actual paid ledger and global budget, and is owner-only', async () => {
  assert.equal((await request('/stylist/credits/reset', '', {})).status, 401);
  const login = await request('/auth/login', '', { email: 'buyer@sifit.com', password: '123456' });
  cookie = login.headers.get('set-cookie').split(';')[0];
  const userId = 'user_buyer_01';
  db.usage.push(...Array.from({ length: 5 }, () => ({ id: randomUUID(), userId, mode: 'live', ...periods(), refunded: false })), { id: randomUUID(), userId: 'other', mode: 'live', ...periods(), refunded: false });
  assert.equal(quota(db.usage, userId, 'live').remaining, 0);
  const reset = await request('/stylist/credits/reset', cookie, {});
  assert.equal(reset.status, 200); assert.equal((await reset.json()).quota.remaining, 5);
  assert.equal(db.usage.filter(u => !u.refunded).length, 6, 'real spend remains in global ledger');
  assert.equal(db.usage.at(-1).allowanceResetAt, undefined, 'other accounts unaffected');
  assert.equal(canReserve(db.usage, userId, 'live', 1, 6), false, 'reset cannot bypass global cap');
});
test('five photo preparations have no paid requests, no credits, no daily creation cap; original keeps its dimensions', async () => {
  const image = await sharp({ create: { width: 1080, height: 1620, channels: 3, background: '#abcabc' } }).png().toBuffer();
  for (let i = 0; i < 5; i++) {
    const body = new FormData(); body.append('photo', new Blob([image], { type: 'image/png' }), 'portrait.png'); body.append('termsAccepted', 'true'); body.append('photoMode', 'original');
    const response = await realFetch(base + '/stylist/model/preview', { method: 'POST', headers: { Cookie: cookie }, body });
    assert.equal(response.status, 200); const { draft } = await response.json();
    if (i === 4) await request('/stylist/model/confirm', cookie, { id: draft.id });
  }
  assert.equal(calls.length, 0); assert.equal((await (await request('/stylist/state', cookie)).json()).quota.dailyUsed, 0);
});
test('Max charges two credits, sends original reference and preserves native provider output; cache is free', async () => {
  const product = MOCK_LISTINGS.find(p => p._id.startsWith('men_') && p.category === 'Tops');
  for (const measurements of [{}, { height: 173 }, { weight: 68 }]) {
    const invalid = await request('/stylist/tryon', cookie, { productIds: [product._id], requestId: randomUUID(), termsAccepted: true, measurements });
    assert.equal(invalid.status, 400);
    assert.equal(calls.length, 0, 'missing required measurements must not reach the paid provider');
  }
  const response = await request('/stylist/tryon', cookie, { engine: 'max', productIds: [product._id], requestId: randomUUID(), termsAccepted: true });
  assert.equal(response.status, 202); const { job } = await response.json(); assert.equal(job.cost, 2);
  let result;
  for (let i = 0; i < 50; i++) {
    result = await (await request('/stylist/jobs/' + job.id, cookie)).json();
    if (result.job.status === 'completed') break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(result.job.status, 'completed'); assert.equal(result.quota.dailyUsed, 2);
  assert.equal(calls[0].model_name, 'tryon-max'); assert.equal(calls[0].inputs.generation_mode, 'balanced');
  assert.equal(calls[0].inputs.num_images, 1); assert.equal(calls[0].inputs.garment_image, undefined);
  assert.match(calls[0].inputs.product_image, /^data:image\/webp;base64,/);
  const model = await sharp(Buffer.from(calls[0].inputs.model_image.split(',')[1], 'base64')).metadata(); assert.equal(model.width, 1080);
  const output = await request(result.job.imageUrl.replace('/api', ''), cookie); const metadata = await sharp(Buffer.from(await output.arrayBuffer())).metadata();
  assert.equal(metadata.width, 1024); assert.equal(metadata.height, 1536);
  const reused = await (await request('/stylist/tryon', cookie, { engine: 'max', productIds: [product._id], requestId: randomUUID(), termsAccepted: true })).json();
  assert.equal(reused.cached, true); assert.equal(calls.length, 1);
  reject = true;
  const failed = await (await request('/stylist/tryon', cookie, { engine: 'max', productIds: [product._id], requestId: randomUUID(), regenerate: true, termsAccepted: true })).json();
  for (let i = 0; i < 40; i++) { const d = await (await request('/stylist/jobs/' + failed.job.id, cookie)).json(); if (d.job.status === 'failed') { assert.equal(d.quota.dailyUsed, 2, 'both rejected credits refunded'); break; } await new Promise(resolve => setTimeout(resolve, 100)); }
});
test('v1.6 quality input types; men/women recommendation filters do not leak categories', () => {
  const p = MOCK_LISTINGS.find(p => p._id.startsWith('men_') && p.category === 'Tops');
  const input = providerInputs(Buffer.from('image'), 'reference', p, 42, tryonSettings());
  assert.equal(input.inputs.mode, 'quality'); assert.equal(input.inputs.garment_photo_type, 'model');
  assert.equal(input.inputs.num_samples, 1); assert.equal(input.inputs.prompt, undefined);
  const jpegInput = providerInputs(Buffer.from([0xff, 0xd8, 0xff]), 'reference', p, 42, tryonSettings());
  assert.match(jpegInput.inputs.model_image, /^data:image\/jpeg;base64,/);
  const products = [{ _id: 'm', gender: 'men', category: 'Tops', price: 1 }, { _id: 'w', gender: 'women', category: 'Tops', price: 1 }];
  assert.deepEqual(rankRecommendations(products, [[1], [1]], [1], [], 10, 'men').map(p => p._id), ['m']);
  assert.deepEqual(rankRecommendations(products, [[1], [1]], [1], [], 10, 'women').map(p => p._id), ['w']);
});
test('standard mode routes a shirt/pants/shoes outfit through the correct models within five daily credits', async () => {
  reject = false;
  await request('/stylist/credits/reset', cookie, {});
  const products = ['Tops', 'Bottoms', 'Footwear'].map(category => MOCK_LISTINGS.find(p => p._id.startsWith('men_') && p.category === category));
  const startCalls = calls.length;
  const response = await request('/stylist/tryon', cookie, { engine: 'v1.6', productIds: products.map(p => p._id), requestId: randomUUID(), termsAccepted: true });
  assert.equal(response.status, 202); const { job } = await response.json();
  assert.equal(job.cost, 4); assert.deepEqual(job.stepModels, ['tryon-v1.6', 'tryon-v1.6', 'tryon-max']);
  let final;
  for (let i = 0; i < 80; i++) { final = await (await request('/stylist/jobs/' + job.id, cookie)).json(); if (final.job.status === 'completed') break; await new Promise(resolve => setTimeout(resolve, 100)); }
  assert.equal(final.job.status, 'completed'); assert.equal(final.quota.dailyUsed, 4);
  assert.deepEqual(calls.slice(startCalls).map(p => p.model_name), ['tryon-v1.6', 'tryon-v1.6', 'tryon-max']);
});
