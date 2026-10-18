import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

const directory = await mkdtemp(path.join(tmpdir(), 'sifit-history-test-'));
process.env.SIFIT_DATA_DIR = directory;
process.env.SIFIT_API_PORT = '0';
process.env.TRYON_MODE = 'demo';
const { server } = await import('./index.mjs');
await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(async () => { await new Promise(resolve => server.close(resolve)); assert.equal(path.dirname(directory), path.resolve(tmpdir())); await rm(directory, { recursive: true, force: true }); });
async function request(route, cookie, body, method = body ? 'POST' : 'GET') {
  return fetch(`${base}${route}`, { method, headers: { Cookie: cookie || '', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(route === '/stylist/tryon' ? { measurements: {height:173,weight:68}, ...body } : body) } : {}) });
}
async function login(email) {
  const r = await request('/auth/login', '', { email, password: '123456' });
  assert.equal(r.status, 200); return r.headers.get('set-cookie').split(';')[0];
}
async function preview(cookie, color) {
  const photo = await sharp({ create: { width: 864, height: 1296, channels: 3, background: color } }).png().toBuffer();
  const form = new FormData(); form.append('photo', new Blob([photo], { type: 'image/png' }), 'photo.png'); form.append('photoMode', 'original'); form.append('termsAccepted', 'true');
  const r = await fetch(`${base}/stylist/model/preview`, { method: 'POST', headers: { Cookie: cookie }, body: form });
  assert.equal(r.status, 200); return (await r.json()).draft;
}
test('replacement is transactional; cancel preserves model, history and credits; album stays private across replacements', async () => {
  const buyer = await login('buyer@sifit.com'), other = await login('buyer2@sifit.com');
  const first = await preview(buyer, '#aaccdd');
  await request('/stylist/model/confirm', buyer, { id: first.id });
  const twoTops = await request('/stylist/tryon', buyer, { productIds: ['local_04', 'local_07'], requestId: randomUUID(), termsAccepted: true });
  assert.equal(twoTops.status, 400);
  const dressAndTop = await request('/stylist/tryon', buyer, { productIds: ['local_09', 'local_04'], requestId: randomUUID(), termsAccepted: true });
  assert.equal(dressAndTop.status, 400);
  const started = await request('/stylist/tryon', buyer, { productIds: ['local_04', 'local_05'], requestId: randomUUID(), termsAccepted: true });
  assert.equal(started.status, 202); const { job } = await started.json();
  for (let i = 0; i < 40; i++) {
    const data = await (await request(`/stylist/jobs/${job.id}`, buyer)).json();
    if (data.job.status === 'completed') break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const done = (await (await request(`/stylist/jobs/${job.id}`, buyer)).json()).job;
  assert.equal(done.status, 'completed'); assert.equal(done.modelId, first.id);
  assert.equal((await request(`/stylist/jobs/${job.id}/album`, other, { saved: true }, 'PATCH')).status, 404);
  assert.equal((await request(`/stylist/jobs/${job.id}/album`, buyer, { saved: true }, 'PATCH')).status, 200);
  const second = await preview(buyer, '#ccddaa');
  let state = await (await request('/stylist/state', buyer)).json();
  assert.equal(state.profile.id, first.id); assert.equal(state.jobs[0].id, job.id);
  await request('/stylist/model/draft', buyer, undefined, 'DELETE');
  assert.equal((await request(second.imageUrl.replace('/api', ''), buyer)).status, 404);
  assert.equal((await request(first.imageUrl.replace('/api', ''), buyer)).status, 200);
  const third = await preview(buyer, '#ddaacc');
  await request('/stylist/model/confirm', buyer, { id: third.id });
  state = await (await request('/stylist/state', buyer)).json();
  assert.equal(state.profile.id, third.id); assert.equal(state.jobs.length, 0); assert.equal(state.quota.dailyUsed, 2);
  const album = await (await request('/stylist/history?album=true', buyer)).json();
  assert.equal(album.jobs.length, 1); assert.equal(album.jobs[0].id, job.id);
  assert.equal((await request(done.imageUrl.replace('/api', ''), buyer)).status, 200);
  assert.equal((await request(done.imageUrl.replace('/api', ''), other)).status, 404);
  assert.equal((await (await request('/stylist/history', other)).json()).total, 0);
  assert.equal((await request(`/stylist/jobs/${job.id}`, other, undefined, 'DELETE')).status, 404);
  await request(`/stylist/jobs/${job.id}`, buyer, undefined, 'DELETE');
  assert.equal((await (await request('/stylist/history', buyer)).json()).total, 0);
  assert.equal((await request(done.imageUrl.replace('/api', ''), buyer)).status, 404);
  state = await (await request('/stylist/state', buyer)).json();
  assert.equal(state.quota.dailyUsed, 2); assert.equal(state.modelAttemptsLeft, null);
});
