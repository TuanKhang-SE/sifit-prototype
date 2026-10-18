import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { backgroundOptions } from './backgrounds.mjs';
const directory = await mkdtemp(path.join(tmpdir(), 'sifit-photo-test-'));
process.env.SIFIT_DATA_DIR = directory;
process.env.SIFIT_API_PORT = '0';
process.env.TRYON_MODE = 'demo';
const { server } = await import('./index.mjs');
await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(async () => { await new Promise(resolve => server.close(resolve)); assert.equal(path.dirname(directory), path.resolve(tmpdir())); await rm(directory, { recursive: true, force: true }); });
test('original photo is kept, face hiding optional, consent required, measurements excluded', async () => {
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'buyer@sifit.com', password: '123456' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const original = await sharp({ create: { width: 864, height: 1296, channels: 3, background: '#c0d3e5' } }).png().toBuffer();
  function form(accepted) { const data = new FormData(); data.append('photo', new Blob([original], { type: 'image/png' }), 'photo.png'); data.append('photoMode', 'original'); data.append('termsAccepted', String(accepted)); data.append('measurements', 'invalid-not-used-here'); return data; }
  assert.equal((await fetch(`${base}/stylist/model/preview`, { method: 'POST', headers: { Cookie: cookie }, body: form(false) })).status, 400);
  const preview = await fetch(`${base}/stylist/model/preview`, { method: 'POST', headers: { Cookie: cookie }, body: form(true) });
  assert.equal(preview.status, 200);
  const { draft } = await preview.json();
  assert.equal(draft.photoMode, 'original'); assert.equal(draft.hideFace, false); assert.equal(draft.measurements, undefined); assert.ok(draft.consentAt);
  const image = await fetch(`http://127.0.0.1:${server.address().port}${draft.imageUrl}`, { headers: { Cookie: cookie } });
  const pixels = await sharp(Buffer.from(await image.arrayBuffer())).raw().toBuffer();
  assert.deepEqual([...pixels.subarray(0, 3)], [192, 211, 229]);
});
test('only bundled backgrounds allowed', () => {
  assert.throws(() => backgroundOptions('../store.json'));
  assert.ok(backgroundOptions('scene-4').backgroundPath);
  assert.ok(backgroundOptions('decor-4').decorPath);
});
