import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { blurFace } from './faceBlur.mjs';
import { MOCK_LISTINGS } from '../src/data/mockData.js';

const directory = await mkdtemp(path.join(tmpdir(), 'sifit-stylist-test-'));
process.env.SIFIT_DATA_DIR = directory;
process.env.SIFIT_API_PORT = '0';
process.env.TRYON_MODE = 'live';
process.env.FASHN_API_KEY = 'test-only-no-network';
const fetchOriginal = globalThis.fetch;
const calls = [];
let scenario = 'success';
let scenarioCalls = 0;
// Test double at the HTTP boundary. No paid FASHN requests leave this process.
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith('https://api.fashn.ai/')) {
    if (options?.method === 'POST') {
      const body = JSON.parse(options.body); calls.push(body); scenarioCalls++;
      if (scenario === 'reject' || (scenario === 'partial' && scenarioCalls === 2)) return Response.json({ error: 'test rejection' }, { status: 422 });
      if (scenario === 'unknown') throw new Error('Network interrupted after submission');
      return Response.json({ id: randomUUID(), error: null });
    }
    const output = await sharp({ create: { width: 864, height: 1296, channels: 3, background: '#8aaf82' } }).png().toBuffer();
    return Response.json({ status: 'completed', output: [`data:image/png;base64,${output.toString('base64')}`] });
  }
  return fetchOriginal(url, options);
};
const { server } = await import('./index.mjs');
await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(async () => {
  await new Promise(resolve => server.close(resolve)); globalThis.fetch = fetchOriginal;
  // mkdtemp gave this exact test-owned directory; don't remove any parent path.
  assert.equal(path.dirname(directory), path.resolve(tmpdir()));
  await rm(directory, { recursive: true, force: true });
});
async function request(route, cookie = '', body, method = 'GET') {
  return fetchOriginal(`${base}${route}`, { method: body ? 'POST' : method, headers: { Cookie: cookie, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(route === '/stylist/tryon' ? { termsAccepted: true, measurements: {height:173,weight:68}, ...body } : body) } : {}) });
}
async function login(email) {
  const response = await request('/auth/login', '', { email, password: '123456' }); assert.equal(response.status, 200);
  return response.headers.get('set-cookie').split(';')[0];
}
const top = MOCK_LISTINGS.find(p => p.category === 'Tops' && p.status === 'active');
const bottom = MOCK_LISTINGS.find(p => p.category === 'Bottoms' && p.status === 'active');
const jacket = MOCK_LISTINGS.find(p => p.category === 'Outerwear' && p.status === 'active');
const fixture = await sharp(Buffer.from('<svg width="864" height="1296"><rect width="864" height="1296" fill="#c0d3e5"/><circle cx="432" cy="170" r="70" fill="#d9a777"/><rect x="405" y="230" width="54" height="60" fill="#d9a777"/><rect x="290" y="260" width="284" height="550" rx="60" fill="#963344"/><rect x="300" y="780" width="100" height="400" fill="#222b42"/><rect x="464" y="780" width="100" height="400" fill="#222b42"/></svg>')).png().toBuffer();
async function preview(cookie) {
  const form = new FormData(); form.append('photo', new Blob([fixture], { type: 'image/png' }), 'person.png'); form.append('hideFace', 'true'); form.append('faceBox', JSON.stringify({ x: 0.419, y: 0.077, width: 0.162, height: 0.108 })); form.append('termsAccepted', 'true'); form.append('photoMode', 'remove'); form.append('backgroundId', 'scene-1');
  const r = await fetchOriginal(`${base}/stylist/model/preview`, { method: 'POST', headers: { Cookie: cookie }, body: form });
  assert.equal(r.status, 200, JSON.stringify(await r.clone().json())); return r.json();
}
async function poll(cookie, id) {
  for (let i = 0; i < 70; i++) {
    const data = await (await request(`/stylist/jobs/${id}`, cookie)).json();
    if (!['queued', 'running'].includes(data.job.status)) return data;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Test job timed out');
}
let buyer, buyer2, profile;
test('login required; session cookie and persistent hashed registrations', async () => {
  assert.equal((await request('/stylist/state')).status, 401);
  assert.equal((await request('/auth/login', '', { email: 'buyer@sifit.com', password: 'bad' })).status, 401);
  buyer = await login('buyer@sifit.com'); buyer2 = await login('buyer2@sifit.com');
  assert.equal((await request('/stylist/demo/reset', buyer, {})).status, 403);
  const reg = await request('/auth/register', '', { name: 'Persistent member', email: 'new@demo.test', password: '123456', role: 'buyer' });
  assert.equal(reg.status, 200);
  assert.match(reg.headers.get('set-cookie'), /HttpOnly/);
  const stored = JSON.parse(await readFile(path.join(directory, 'store.json'), 'utf8'));
  const member = stored.users.find(u => u.email === 'new@demo.test');
  assert.ok(member.hash); assert.equal(member.password, undefined);
  assert.equal((await request('/auth/register', '', { name: 'Admin', email: 'admin@demo.test', password: '123456', role: 'admin' })).status, 400);
});
test('real rembg preview, face masking, confirm and ownership; photo processing uses no credits', async () => {
  const first = await preview(buyer); assert.equal(first.modelAttemptsLeft, null);
  const recompose = await request('/stylist/model/background', buyer, { id: first.draft.id, backgroundId: 'decor-2' });
  assert.equal(recompose.status, 200);
  assert.equal((await recompose.json()).draft.backgroundId, 'decor-2');
  assert.equal((await (await request('/stylist/state', buyer)).json()).modelAttemptsLeft, null);
  const second = await preview(buyer); assert.equal(second.modelAttemptsLeft, null);
  const third = await preview(buyer); assert.equal(third.modelAttemptsLeft, null);
  const form = new FormData(); form.append('photo', new Blob([fixture], { type: 'image/png' }), 'person.png');
  assert.equal((await fetchOriginal(`${base}/stylist/model/preview`, { method: 'POST', headers: { Cookie: buyer }, body: form })).status, 400, 'consent remains required');
  assert.equal((await request('/stylist/model/confirm', buyer, { id: first.draft.id })).status, 409);
  const confirmed = await (await request('/stylist/model/confirm', buyer, { id: third.draft.id })).json(); profile = confirmed.profile;
  const image = await request(profile.imageUrl.replace('/api', ''), buyer); assert.equal(image.status, 200);
  const output = Buffer.from(await image.arrayBuffer());
  const box = profile.faceBox;
  const pixels = await sharp(output).extract({ left: Math.round((box.x + box.width / 2) * 864), top: Math.round((box.y + box.height / 2) * 1296), width: 1, height: 1 }).raw().toBuffer();
  assert.notDeepEqual([...pixels], [238, 237, 234], 'blur retains image colours instead of a white mask');
  const clean = Buffer.from(await (await request(profile.imageUrl.replace('/api', '') + '&unmasked=true', buyer)).arrayBuffer());
  assert.deepEqual(output, await blurFace(clean, box), 'only the transformed face region is blurred');
  assert.equal(profile.backgroundId, 'scene-1');
  assert.equal(profile.photoMode, 'remove');
  assert.equal((await request(profile.imageUrl.replace('/api', ''), buyer2)).status, 404);
  assert.equal((await request(profile.imageUrl.replace('/api', ''))).status, 401);
  assert.equal((await (await request('/stylist/state', buyer)).json()).quota.dailyUsed, 0);
});
test('outfit contract, atomic reservations, concurrent deduplication, cache and daily cap', async () => {
  const body = { productIds: [top._id, bottom._id], requestId: randomUUID() };
  const response = await request('/stylist/tryon', buyer, body); assert.equal(response.status, 202);
  const { job } = await response.json();
  const repeated = await (await request('/stylist/tryon', buyer, body)).json(); assert.equal(repeated.job.id, job.id);
  assert.equal((await request('/stylist/tryon', buyer, { ...body, requestId: randomUUID(), regenerate: true })).status, 409);
  const done = await poll(buyer, job.id); assert.equal(done.job.status, 'completed'); assert.equal(done.quota.dailyUsed, 2);
  assert.equal(calls.length, 2); assert.equal(calls[0].inputs.category, 'bottoms'); assert.equal(calls[1].inputs.category, 'tops');
  assert.equal(calls[0].model_name, 'tryon-v1.6'); assert.equal(calls[0].inputs.mode, 'quality'); assert.equal(calls[0].inputs.segmentation_free, true); assert.equal(calls[0].inputs.num_samples, 1); assert.equal(calls[0].inputs.return_base64, true);
  assert.notEqual(calls[0].inputs.model_image, calls[1].inputs.model_image, 'second garment uses output of first');
  for (const call of calls) {
    const image = Buffer.from(call.inputs.model_image.split(',')[1], 'base64');
    const box = profile.faceBox;
    const pixels = await sharp(image).extract({ left: Math.round((box.x + box.width / 2) * 864), top: Math.round((box.y + box.height / 2) * 1296), width: 1, height: 1 }).raw().toBuffer();
    assert.notDeepEqual([...pixels], [238, 237, 234], 'provider input uses blur instead of a white mask');
    if (call === calls[0]) {
      const clean = await readFile(path.join(directory, `${profile.id}.png`));
      let expected = await blurFace(clean, box);
      if (expected.length > 1024 * 1024) expected = await sharp(expected).resize({ width: 1080, height: 1620, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
      assert.ok(image.equals(expected), 'first provider request obeys face privacy before upload compression');
    }
  }
  const reused = await (await request('/stylist/tryon', buyer, { ...body, productIds: [bottom._id, top._id], requestId: randomUUID() })).json();
  assert.equal(reused.cached, true); assert.equal(calls.length, 2);
  const fresh = await (await request('/stylist/tryon', buyer, { ...body, requestId: randomUUID(), regenerate: true })).json();
  await poll(buyer, fresh.job.id);
  assert.equal((await request('/stylist/tryon', buyer, { ...body, requestId: randomUUID(), regenerate: true })).status, 429);
  const final = await (await request('/stylist/tryon', buyer, { productIds: [jacket._id], requestId: randomUUID() })).json();
  const atCap = await poll(buyer, final.job.id); assert.equal(atCap.quota.dailyUsed, 5);
  assert.equal((await request('/stylist/tryon', buyer, { productIds: [top._id], requestId: randomUUID(), regenerate: true })).status, 429);
  assert.equal((await request('/stylist/jobs/' + job.id, buyer2)).status, 404);
  const state = await (await request('/stylist/state', buyer)).json(); assert.equal(state.jobs.length, 3);
});
test('partial provider failure refunds rejected/unsubmitted steps; unknown request stays reserved', async () => {
  const p = await preview(buyer2); await request('/stylist/model/confirm', buyer2, { id: p.draft.id });
  scenario = 'partial'; scenarioCalls = 0;
  const partial = await (await request('/stylist/tryon', buyer2, { productIds: [bottom._id, top._id, jacket._id], requestId: randomUUID() })).json();
  const failed = await poll(buyer2, partial.job.id); assert.equal(failed.job.status, 'failed'); assert.equal(failed.quota.dailyUsed, 1);
  scenario = 'unknown'; scenarioCalls = 0;
  const uncertain = await (await request('/stylist/tryon', buyer2, { productIds: [top._id], requestId: randomUUID() })).json();
  const unknown = await poll(buyer2, uncertain.job.id); assert.equal(unknown.quota.dailyUsed, 2);
  scenario = 'success';
});
test('local catalog references reach FASHN as image data, never inaccessible localhost URLs', async () => {
  const previous = calls.length;
  const response = await request('/stylist/tryon', buyer2, { productIds: ['local_04'], requestId: randomUUID() });
  assert.equal(response.status, 202);
  const { job } = await response.json();
  const done = await poll(buyer2, job.id);
  assert.equal(done.job.status, 'completed');
  assert.equal(calls.length, previous + 1);
  assert.match(calls.at(-1).inputs.garment_image, /^data:image\/webp;base64,/);
  const metadata = await sharp(Buffer.from(calls.at(-1).inputs.garment_image.split(',')[1], 'base64')).metadata();
  assert.equal(metadata.format, 'webp'); assert.ok(metadata.width > 300);
});
test('delete removes images/history but never resets quota; logout revokes server session', async () => {
  assert.equal((await request('/stylist/model', buyer, undefined, 'DELETE')).status, 200);
  const state = await (await request('/stylist/state', buyer)).json(); assert.equal(state.profile, null); assert.equal(state.jobs.length, 0); assert.equal(state.quota.dailyUsed, 5); assert.equal(state.modelAttemptsLeft, null);
  assert.equal((await request(profile.imageUrl.replace('/api', ''), buyer)).status, 404);
  await request('/auth/logout', buyer, {}); assert.equal((await request('/stylist/state', buyer)).status, 401);
});
