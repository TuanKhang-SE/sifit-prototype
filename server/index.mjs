import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { db, dataDir, persist, publicUser, passwordHash, passwordMatches } from './store.mjs';
import { quota, periods, canReserve } from './quota.mjs';
import { resetDemoAllowance, demoControlsEnabled } from './demoControls.mjs';
import { backgroundOptions } from './backgrounds.mjs';
import { recommendOutfits } from './recommendations.mjs';
import { blurFace } from './faceBlur.mjs';
import { tryonSettings, settingsForProduct, garmentCategory, providerInputs } from './tryonSettings.mjs';
import { MOCK_LISTINGS } from '../src/data/mockData.js';
import { outfitProduct } from './outfitReference.mjs';

const app = express();
const runFile = promisify(execFile);
const port = Number(process.env.SIFIT_API_PORT || 3001);
const mode = process.env.TRYON_MODE === 'live' ? 'live' : 'demo';
const demoControls = demoControlsEnabled(mode);
const accountResetControls = process.env.NODE_ENV !== 'production' && process.env.SIFIT_ACCOUNT_RESET !== 'false';
const globalLimit = Number(process.env.FASHN_MONTHLY_BUDGET || 100);
const apiKey = process.env.FASHN_API_KEY;
const root = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
const busy = new Set();
const authAttempts = new Map();
const recommendationBusy = new Set();
const backgroundThumbs = new Map();
db.bodyProfiles ||= {};
db.stylePreferences ||= {};
for (const p of [...Object.values(db.profiles), ...Object.values(db.drafts)]) if (!p.reversiblePrivacy && p.hideFace) p.faceBaked = true;
const recommendationAttempts = new Map();
const consentVersion = '2026-10-13';
const sessionAge = 7 * 24 * 3600 * 1000;
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin && req.headers.origin !== `${req.protocol}://${req.headers.host}`) return res.status(403).json({ error: 'Nguồn yêu cầu không hợp lệ.' });
  next();
});
function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
function cookie(req) { return req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('sifit_session='))?.slice(14); }
function authenticate(req, res, next) {
  const session = db.sessions[cookie(req)];
  const user = session && session.expires > Date.now() && db.users.find(u => u._id === session.userId && !u.blocked);
  if (!user) return res.status(401).json({ error: 'Vui lòng đăng nhập để dùng AI Stylist.' });
  req.user = user;
  next();
}
function createSession(res, user) {
  const token = randomBytes(32).toString('hex');
  db.sessions[token] = { userId: user._id, expires: Date.now() + sessionAge };
  persist();
  res.cookie('sifit_session', token, { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === 'true', maxAge: sessionAge, path: '/' });
  return res.json({ user: publicUser(user) });
}
function authThrottle(req, res, next) {
  const key = req.ip;
  const value = authAttempts.get(key);
  const record = value && value.until > Date.now() ? value : { count: 0, until: Date.now() + 60000 };
  if (++record.count > 20) return res.status(429).json({ error: 'Bạn đăng nhập quá nhanh. Vui lòng thử lại sau một phút.' });
  authAttempts.set(key, record);
  next();
}
app.post('/api/auth/login', authThrottle, (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || password.length > 128) fail(400, 'Thông tin đăng nhập không hợp lệ.');
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !passwordMatches(password, user.hash) || user.blocked) fail(401, 'Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.');
  createSession(res, user);
});
app.post('/api/auth/register', authThrottle, (req, res) => {
  const { name, email, password, role } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.length > 80 || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 6 || password.length > 128 || !['buyer', 'seller'].includes(role)) fail(400, 'Vui lòng nhập tên, email và mật khẩu ít nhất 6 ký tự.');
  if (db.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) fail(409, 'Email này đã được sử dụng.');
  const user = { _id: randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), hash: passwordHash(password), role, blocked: false, avatar: '', addresses: [], createdAt: new Date().toISOString() };
  db.users.push(user);
  createSession(res, user);
});
app.get('/api/auth/session', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));
app.post('/api/auth/logout', (req, res) => { delete db.sessions[cookie(req)]; persist(); res.clearCookie('sifit_session', { path: '/' }); res.json({ success: true }); });

function viewImage(id) { return `/api/stylist/images/${id}`; }
app.get('/api/stylist/backgrounds/:id', async (req, res) => {
  const settings = backgroundOptions(req.params.id);
  const file = settings.backgroundPath || settings.decorPath;
  if (!file) fail(404, 'Không có ảnh xem trước.');
  if (!backgroundThumbs.has(req.params.id)) backgroundThumbs.set(req.params.id, await sharp(file).resize(140, 210, { fit: 'cover' }).flatten({ background: '#f8faf5' }).webp({ quality: 75 }).toBuffer());
  res.set('Cache-Control', 'public, max-age=86400').type('webp').send(backgroundThumbs.get(req.params.id));
});
function profileFor(userId) {
  const p = db.profiles[userId];
  return p ? { id: p.id, imageUrl: `${viewImage(p.id)}?v=${p.privacyRevision || 0}`, measurements: db.bodyProfiles[userId] || p.measurements || {}, hideFace: p.hideFace, faceBox: p.faceBox, faceBaked: !!p.faceBaked, photoMode: p.photoMode || 'remove', backgroundId: p.backgroundId || 'white', needsUpgrade: !p.composition, createdAt: p.createdAt } : null;
}
function publicJob(job) {
  const { cacheKey: _cacheKey, reservations: _reservations, predictionId: _predictionId, userId: _userId, imageId, ...safe } = job;
  return { ...safe, imageId, imageUrl: imageId ? `${viewImage(imageId)}?v=${job.privacyRevision || 0}` : null };
}
app.get('/api/stylist/state', authenticate, (req, res) => {
  const userId = req.user._id;
  res.json({ stylePreference: db.stylePreferences[userId] || 'all', geminiReady: !!process.env.GEMINI_API_KEY, mode, demoControls, accountResetControls, ready: mode === 'demo' || !!apiKey, measurements: db.bodyProfiles[userId] || db.profiles[userId]?.measurements || {}, profile: profileFor(userId), quota: quota(db.usage, userId, mode), modelAttemptsLeft: null, jobs: Object.values(db.jobs).filter(j => j.userId === userId && j.mode === mode && (!j.modelId || j.modelId === db.profiles[userId]?.id)).reverse().slice(0, 30).map(publicJob) });
});
app.get('/api/stylist/history', authenticate, (req, res) => {
  const page = Math.max(1, Math.min(10000, Math.floor(Number(req.query.page) || 1)));
  const jobs = Object.values(db.jobs).filter(j => j.userId === req.user._id && (req.query.album !== 'true' || j.saved)).reverse();
  res.json({ jobs: jobs.slice((page - 1) * 24, page * 24).map(publicJob), page, hasMore: jobs.length > page * 24, total: jobs.length });
});
app.patch('/api/stylist/jobs/:id/album', authenticate, (req, res) => {
  const job = db.jobs[req.params.id];
  if (!job || job.userId !== req.user._id) fail(404, 'Không tìm thấy lượt thử.');
  if (job.status !== 'completed' || typeof req.body.saved !== 'boolean') fail(400, 'Chỉ lưu ảnh thử đồ đã hoàn tất.');
  job.saved = req.body.saved; persist(); res.json({ job: publicJob(job) });
});
app.delete('/api/stylist/jobs/:id', authenticate, async (req, res) => {
  const job = db.jobs[req.params.id];
  if (!job || job.userId !== req.user._id) fail(404, 'Không tìm thấy lượt thử.');
  if (['queued', 'running'].includes(job.status)) fail(409, 'Vui lòng đợi lượt thử hoàn tất.');
  delete db.jobs[job.id]; persist();
  if (job.imageId) await unlink(path.join(dataDir, `${job.imageId}.png`)).catch(() => {});
  res.json({ success: true });
});
app.post('/api/stylist/recommendations', authenticate, async (req, res) => {
  const { prompt, excludeIds = [], budget, gender = db.stylePreferences[req.user._id] || 'all', photoConsent } = req.body;
  if (!['all', 'men', 'women', 'unisex'].includes(gender) || typeof prompt !== 'string' || !prompt.trim() || prompt.length > 500 || !Array.isArray(excludeIds) || excludeIds.length > 50 || excludeIds.some(id => typeof id !== 'string') || (budget != null && (!Number.isFinite(budget) || budget < 0))) fail(400, 'Nhập phong cách bạn muốn, tối đa 500 ký tự.');
  if (recommendationBusy.has(req.user._id)) fail(409, 'AI đang tìm gợi ý. Vui lòng đợi.');
  const submitted = req.body.measurements || {};
  if (typeof submitted !== 'object' || Array.isArray(submitted)) fail(400, 'Số đo không hợp lệ.');
  const info = measurements(submitted);
  if (!db.profiles[req.user._id]) fail(400, 'Tải và lưu ảnh toàn thân trước khi dùng gợi ý đồ mặc.');
  requireBodyBasics(info);
  if (process.env.GEMINI_API_KEY && photoConsent !== true) fail(400, 'Đồng ý dùng ảnh để AI gợi ý đồ mặc.');
  const usePhoto = photoConsent === true;
  const attempts = recommendationAttempts.get(req.user._id) || [];
  const recent = attempts.filter(t => t > Date.now() - 60000);
  if (process.env.GEMINI_API_KEY && usePhoto && recent.length >= 5) fail(429, 'Bạn gợi ý quá nhanh. Vui lòng thử lại sau một phút.');
  recommendationAttempts.set(req.user._id, [...recent, Date.now()]);
  recommendationBusy.add(req.user._id);
  try {
    const profile = db.profiles[req.user._id];
    const image = usePhoto ? await blurFace(await readFile(path.join(dataDir, `${profile.id}.png`)), profile.hideFace ? profile.faceBox : null) : undefined;
    const result = await recommendOutfits({ prompt: prompt.trim(), excludeIds, budget, gender, measurements: info, image, userId: req.user._id });
    db.bodyProfiles[req.user._id] = info; db.stylePreferences[req.user._id] = gender; persist(); res.json(result);
  }
  catch (error) { console.error('Recommendations:', error.message.slice(0, 180)); fail(503, 'Chưa tải được model gợi ý. Bạn vẫn có thể chọn đồ trong giỏ và thử.'); }
  finally { recommendationBusy.delete(req.user._id); }
});
app.post('/api/stylist/credits/reset', authenticate, (req, res) => {
  if (!accountResetControls) fail(403, 'Reset tài khoản chỉ được bật trong bản local để kiểm thử.');
  if (busy.has(req.user._id)) fail(409, 'Đợi tác vụ đang chạy hoàn tất rồi reset.');
  const { month } = periods();
  for (const entry of db.usage) if (entry.userId === req.user._id && entry.mode === mode && entry.month === month && !entry.refunded) entry.allowanceResetAt = new Date().toISOString();
  persist();
  res.json({ quota: quota(db.usage, req.user._id, mode), message: 'Đã reset hạn mức tài khoản. Credit đã mua ở FASHN và ngân sách chung không thay đổi.' });
});
app.post('/api/stylist/demo/reset', authenticate, (req, res) => {
  if (!demoControls) fail(403, 'Reset chỉ có trong bản demo local, không áp dụng cho credit FASHN thật.');
  if (busy.has(req.user._id)) fail(409, 'Đợi tác vụ đang chạy hoàn tất rồi reset.');
  resetDemoAllowance(db, req.user._id);
  persist();
  res.json({ quota: quota(db.usage, req.user._id, mode), modelAttemptsLeft: null });
});
app.get('/api/stylist/images/:id', authenticate, async (req, res) => {
  const id = req.params.id;
  const own = [db.profiles[req.user._id], db.drafts[req.user._id]].find(p => p?.id === id);
  const job = Object.values(db.jobs).find(j => j.userId === req.user._id && j.imageId === id);
  if (!own && !job) fail(404, 'Không tìm thấy ảnh.');
  const record = own || job;
  const buffer = await readFile(path.join(dataDir, `${id}.png`));
  res.type('png').send(req.query.unmasked === 'true' ? buffer : await blurFace(buffer, record.hideFace ? record.faceBox : null));
});
app.patch('/api/stylist/images/:id/privacy', authenticate, (req, res) => {
  const id = req.params.id;
  const profile = db.profiles[req.user._id];
  const record = [profile, db.drafts[req.user._id]].find(p => p?.id === id) || Object.values(db.jobs).find(j => j.userId === req.user._id && j.imageId === id && j.status === 'completed');
  if (!record) fail(404, 'Không tìm thấy ảnh.');
  if (busy.has(req.user._id)) fail(409, 'Vui lòng đợi tác vụ đang chạy.');
  if (typeof req.body.hideFace !== 'boolean') fail(400, 'Lựa chọn ẩn mặt không hợp lệ.');
  const box = req.body.hideFace ? parseFaceBox(JSON.stringify(req.body.faceBox)) : record.faceBox;
  record.hideFace = req.body.hideFace; record.faceBox = box; record.privacyRevision = (record.privacyRevision || 0) + 1;
  persist();
  res.json({ profile: profileFor(req.user._id), job: record.imageId ? publicJob(record) : undefined, imageUrl: `${viewImage(id)}?v=${record.privacyRevision}` });
});
async function maskImage(buffer, faceBox, preserveSize = false) {
  const normalized = await sharp(buffer, { limitInputPixels: 25000000 }).rotate().resize(preserveSize ? { width: 1080, height: 1620, fit: 'inside', withoutEnlargement: true } : { width: 864, height: 1296, fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).png().toBuffer();
  return blurFace(normalized, faceBox);
}
const maskOutput = blurFace;
async function detectImageFace(buffer) {
  const filename = path.join(dataDir, `${randomUUID()}.face-input.png`);
  try {
    await writeFile(filename, buffer);
    const result = await runFile(process.env.PYTHON_BIN || 'python', [path.join(root, 'detect_face.py'), filename], { timeout: 15000, windowsHide: true, maxBuffer: 100000 });
    const box = JSON.parse(result.stdout.trim());
    return box ? parseFaceBox(JSON.stringify(box)) : null;
  } catch { return null; }
  finally { await unlink(filename).catch(() => {}); }
}
app.post('/api/stylist/images/:id/detect-face', authenticate, async (req, res) => {
  const id = req.params.id;
  const own = [db.profiles[req.user._id], db.drafts[req.user._id]].some(p => p?.id === id) || Object.values(db.jobs).some(j => j.userId === req.user._id && j.imageId === id);
  if (!own) fail(404, 'Không tìm thấy ảnh.');
  res.json({ faceBox: await detectImageFace(await readFile(path.join(dataDir, `${id}.png`))) });
});
function parseFaceBox(raw) {
  const box = JSON.parse(raw || 'null');
  if (!box || !['x', 'y', 'width', 'height'].every(key => typeof box[key] === 'number' && Number.isFinite(box[key])) || box.x < 0 || box.y < 0 || box.width < 0.02 || box.height < 0.02 || box.width > 0.4 || box.height > 0.35 || box.x + box.width > 1 || box.y + box.height > 1) fail(400, 'Vùng mặt không hợp lệ. Hãy chọn lại vùng mặt cần ẩn.');
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}
function requireBodyBasics(info) {
  if (!info.height || !info.weight) fail(400, 'Vui lòng nhập chiều cao và cân nặng.');
}
function measurements(input) {
  const ranges = { height: [80, 250], weight: [20, 300], bust: [30, 250], waist: [30, 250], hips: [30, 250] };
  const result = {};
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (input[key] === '' || input[key] == null) continue;
    const n = Number(input[key]);
    if (!Number.isFinite(n) || n < min || n > max) fail(400, `Số đo ${key} không hợp lệ.`);
    result[key] = n;
  }
  return result;
}
app.put('/api/stylist/measurements', authenticate, (req, res) => {
  const input = req.body.measurements;
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Số đo không hợp lệ.');
  const gender = req.body.stylePreference;
  if (gender != null && !['all', 'men', 'women', 'unisex'].includes(gender)) fail(400, 'Lựa chọn trang phục không hợp lệ.');
  const info = measurements(input);
  requireBodyBasics(info);
  db.bodyProfiles[req.user._id] = info;
  if (gender != null) db.stylePreferences[req.user._id] = gender;
  persist(); res.json({ measurements: info, stylePreference: db.stylePreferences[req.user._id] || 'all' });
});
app.post('/api/stylist/model/preview', authenticate, upload.single('photo'), async (req, res) => {
  const userId = req.user._id;
  if (busy.has(userId)) fail(409, 'Đang xử lý ảnh. Vui lòng đợi.');
  if (!req.file || !['image/jpeg', 'image/png', 'image/webp'].includes(req.file.mimetype)) fail(400, 'Chọn ảnh JPG, PNG hoặc WebP, tối đa 8 MB.');
  if (req.body.termsAccepted !== 'true') fail(400, 'Vui lòng đồng ý điều khoản xử lý ảnh.');
  const photoMode = req.body.photoMode || 'remove';
  if (!['original', 'remove'].includes(photoMode)) fail(400, 'Chế độ ảnh không hợp lệ.');
  const backdrop = backgroundOptions(photoMode === 'original' ? 'white' : req.body.backgroundId || 'white');
  const hideFace = req.body.hideFace === 'true';
  const faceBox = hideFace ? parseFaceBox(req.body.faceBox) : null;
  const id = randomUUID();
  const source = path.join(dataDir, `${id}.input.png`);
  const target = path.join(dataDir, `${id}.png`);
  const metadata = path.join(dataDir, `${id}.meta.json`);
  const cutoutPath = path.join(dataDir, `${id}.cutout.png`);
  busy.add(userId);
  try {
    const normalized = await maskImage(req.file.buffer, null, photoMode === 'original');
    await writeFile(source, normalized); // Private original enables reversible face blur; never publicly served.
    let composition;
    if (photoMode === 'original') {
      await writeFile(target, normalized);
      composition = { faceBox, backgroundId: null, composition: 'original-v2' };
    } else {
      await runFile(process.env.PYTHON_BIN || 'python', [path.join(root, 'remove_background.py'), source, target, metadata, JSON.stringify({ faceBox, applyMask: false, cutoutPath, ...backdrop })], { timeout: 180000, windowsHide: true, env: { ...process.env, OMP_NUM_THREADS: '2' }, maxBuffer: 2 * 1024 * 1024 });
      composition = JSON.parse(await readFile(metadata, 'utf8'));
    }
    await writeFile(target, await maskImage(await readFile(target), null, photoMode === 'original'));
    const previous = db.drafts[userId];
    db.drafts[userId] = { id, userId, hideFace, faceBox: composition.faceBox, sourceFaceBox: faceBox, photoMode, backgroundId: composition.backgroundId, composition: composition.composition, reversiblePrivacy: true, consentVersion, consentAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    persist();
    if (previous) await Promise.all(['.png', '.cutout.png'].map(suffix => unlink(path.join(dataDir, `${previous.id}${suffix}`)).catch(() => {})));
    res.json({ draft: { ...db.drafts[userId], imageUrl: viewImage(id) }, modelAttemptsLeft: null });
  } catch (error) {
    await unlink(target).catch(() => {});
    await unlink(cutoutPath).catch(() => {});
    console.error('Background removal:', error.message.slice(0, 300));
    fail(503, 'Chưa xử lý được ảnh. Kiểm tra Python/rembg ở backend hoặc chọn ảnh rõ hơn; lần lỗi không trừ lượt tạo.');
  } finally { busy.delete(userId); await Promise.all([source, metadata].map(file => unlink(file).catch(() => {}))); }
});
app.post('/api/stylist/model/background', authenticate, async (req, res) => {
  const userId = req.user._id, draft = db.drafts[userId];
  if (busy.has(userId)) fail(409, 'Đang xử lý ảnh. Vui lòng đợi.');
  if (!draft || draft.id !== req.body.id || draft.photoMode !== 'remove') fail(409, 'Tạo ảnh đã tách nền trước khi đổi phông.');
  const backdrop = backgroundOptions(req.body.backgroundId);
  const target = path.join(dataDir, `${draft.id}.png`), metadata = path.join(dataDir, `${draft.id}.meta.json`);
  busy.add(userId);
  try {
    await runFile(process.env.PYTHON_BIN || 'python', [path.join(root, 'remove_background.py'), path.join(dataDir, `${draft.id}.cutout.png`), target, metadata, JSON.stringify({ ...backdrop, faceBox: draft.sourceFaceBox, applyMask: false, reuseCutout: true })], { timeout: 30000, windowsHide: true });
    const composed = JSON.parse(await readFile(metadata, 'utf8'));
    Object.assign(draft, composed); persist();
    res.json({ draft: { ...draft, imageUrl: `${viewImage(draft.id)}?v=${Date.now()}` } });
  } finally { busy.delete(userId); await unlink(metadata).catch(() => {}); }
});
app.delete('/api/stylist/model/draft', authenticate, async (req, res) => {
  const userId = req.user._id;
  if (busy.has(userId)) fail(409, 'Vui lòng chờ tác vụ đang chạy.');
  const draft = db.drafts[userId]; delete db.drafts[userId]; persist();
  if (draft) await Promise.all(['.png', '.cutout.png'].map(suffix => unlink(path.join(dataDir, `${draft.id}${suffix}`)).catch(() => {})));
  res.json({ success: true });
});
app.post('/api/stylist/model/confirm', authenticate, (req, res) => {
  const userId = req.user._id;
  if (busy.has(userId)) fail(409, 'Vui lòng chờ tác vụ đang chạy.');
  const draft = db.drafts[userId];
  if (!draft || req.body.id !== draft.id) fail(409, 'Ảnh xem trước đã thay đổi. Vui lòng tạo lại.');
  const previous = db.profiles[userId];
  db.profiles[userId] = draft;
  delete db.drafts[userId];
  // Keep private history; cached results remain tied to their model.
  for (const j of Object.values(db.jobs)) if (j.userId === userId && !j.modelId) j.modelId = previous?.id || 'legacy';
  persist();
  if (previous) for (const suffix of ['.png', '.cutout.png']) void unlink(path.join(dataDir, `${previous.id}${suffix}`)).catch(() => {});
  res.json({ profile: profileFor(userId) });
});
app.delete('/api/stylist/model', authenticate, async (req, res) => {
  const userId = req.user._id;
  if (busy.has(userId)) fail(409, 'Vui lòng chờ tác vụ đang chạy trước khi xóa.');
  const ids = [db.profiles[userId]?.id, db.drafts[userId]?.id];
  delete db.profiles[userId]; delete db.drafts[userId];
  for (const j of Object.values(db.jobs)) if (j.userId === userId) { ids.push(j.imageId); delete db.jobs[j.id]; }
  persist(); // quota and model attempt counters intentionally survive deletion
  delete db.bodyProfiles[userId]; delete db.stylePreferences[userId]; persist();
  await Promise.all(ids.filter(Boolean).flatMap(id => ['.png', '.cutout.png'].map(suffix => unlink(path.join(dataDir, `${id}${suffix}`)).catch(() => {}))));
  res.json({ success: true });
});

function itemsFor(ids, maxItems = 3) {
  const categories = ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories'];
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > maxItems || new Set(ids).size !== ids.length) fail(400, `Chọn từ một đến ${maxItems} món thời trang.`);
  const items = ids.map(id => MOCK_LISTINGS.find(p => p._id === id && p.status === 'active' && categories.includes(p.category)));
  if (items.some(p => !p)) fail(400, 'Sản phẩm không hỗ trợ thử đồ hoặc đã hết hàng.');
  if (new Set(items.map(p => p.category)).size !== items.length) fail(400, 'Chọn tối đa một món trong mỗi nhóm: áo, quần/váy, áo khoác.');
  if (items.some(p => garmentCategory(p) === 'one-pieces') && items.some(p => ['Tops', 'Bottoms'].includes(p.category) && garmentCategory(p) !== 'one-pieces')) fail(400, 'Váy liền không phối cùng áo hoặc quần khác trong một lượt.');
  return items.sort((a, b) => ['Bottoms', 'Tops', 'Outerwear', 'Footwear', 'Accessories'].indexOf(a.category) - ['Bottoms', 'Tops', 'Outerwear', 'Footwear', 'Accessories'].indexOf(b.category));
}
async function providerJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...options.headers }, signal: AbortSignal.timeout(options.method === 'POST' ? 90000 : 30000) });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const e = new Error(`FASHN HTTP ${response.status}`);
    e.providerStatus = response.status;
    e.providerCode = typeof detail.error === 'object' ? detail.error?.name : undefined;
    // A failed poll or server error does not prove a submitted job was rejected.
    e.rejected = options.method === 'POST' && response.status >= 400 && response.status < 500;
    throw e;
  }
  return response.json();
}
async function fashn(image, product, seed, job, settings) {
  let garmentImage = product.images[0];
  if (garmentImage.startsWith('/images/catalog/')) {
    const filename = garmentImage.slice('/images/catalog/'.length);
    try {
      if (!/^[a-z0-9_-]+\.webp$/.test(filename)) throw new Error('Invalid catalog image');
      const buffer = await readFile(path.join(root, '../public/images/catalog', filename));
      garmentImage = `data:image/webp;base64,${buffer.toString('base64')}`;
    } catch (error) { error.rejected = true; throw error; } // Nothing sent to provider; refund this step.
  }
  // Large lossless portraits can time out while uploading. Keep stored originals;
  // compress only the provider copy, after applying the chosen face privacy.
  if (image.length > 1024 * 1024) image = await sharp(image).resize({ width: 1080, height: 1620, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  const data = await providerJson('https://api.fashn.ai/v1/run', { method: 'POST', body: JSON.stringify(providerInputs(image, garmentImage, product, seed, settings)) });
  if (!data.id || data.error) { const e = new Error('FASHN rejected request'); e.rejected = true; throw e; }
  job.predictionId = data.id;
  persist();
  for (let i = 0; i < 100; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const status = await providerJson(`https://api.fashn.ai/v1/status/${encodeURIComponent(data.id)}`);
    if (status.status === 'failed' || status.error) { const e = new Error('FASHN generation failed'); e.providerCode = status.error?.name; e.rejected = true; throw e; }
    if (status.status === 'completed') {
      const output = status.output?.[0];
      if (typeof output !== 'string') throw new Error('Missing FASHN output');
      if (output.startsWith('data:image/')) return Buffer.from(output.slice(output.indexOf(',') + 1), 'base64');
      const url = new URL(output);
      if (url.protocol !== 'https:' || !['cdn.fashn.ai', 'fashn.ai'].includes(url.hostname)) throw new Error('Unexpected FASHN output host');
      const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error('Output download failed');
      return Buffer.from(await response.arrayBuffer());
    }
  }
  throw new Error('FASHN timeout');
}
async function runJob(job, profile, items, settings) {
  let submitted = 0;
  try {
    job.status = 'running'; persist();
    let image = await readFile(path.join(dataDir, `${profile.id}.png`));
    let faceBox = profile.faceBox;
    const references = job.engine === 'outfit' ? [await outfitProduct(items)] : items;
    for (let index = 0; index < references.length; index++) {
      const stepSettings = settings[index];
      const reservations = job.reservations.slice(submitted, submitted + stepSettings.credits).map(id => db.usage.find(u => u.id === id));
      job.step = index + 1;
      submitted += stepSettings.credits;
      job.submittedCredits = submitted;
      persist(); // Record uncertainty before any paid HTTP submission.
      try {
        if (mode === 'live') image = await fashn(await maskOutput(image, profile.hideFace ? faceBox : null), references[index], job.seed, job, stepSettings);
        else await new Promise(resolve => setTimeout(resolve, 650));
        image = await maskOutput(image, null);
        if (profile.hideFace) {
          faceBox = await detectImageFace(image) || faceBox;
          job.faceBox = faceBox;
        }
        job.stepsCompleted = index + 1;
        persist();
      } catch (error) {
        if (error.rejected) for (const reservation of reservations) reservation.refunded = true;
        throw error;
      }
    }
    job.imageId = randomUUID();
    await writeFile(path.join(dataDir, `${job.imageId}.png`), image);
    job.status = 'completed';
  } catch (error) {
    for (const id of job.reservations.slice(submitted)) db.usage.find(u => u.id === id).refunded = true;
    job.status = 'failed';
    const reasons = { 401: 'API key FASHN không hợp lệ.', 403: 'API key chưa có quyền gọi model FASHN.', 402: 'Tài khoản FASHN không đủ credit.', 422: 'FASHN từ chối ảnh hoặc thông số đầu vào.', 429: 'FASHN đang giới hạn lượt gọi. Vui lòng đợi rồi thử lại.' };
    const reason = error.providerCode === 'PoseError' ? 'FASHN chưa nhận diện được tư thế. Hãy dùng ảnh rõ toàn thân, lộ tay chân.' : reasons[error.providerStatus] || (['TimeoutError', 'AbortError'].includes(error.name) ? 'Kết nối FASHN quá thời gian chờ; chưa xác định được lượt đã nhận.' : 'FASHN chưa hoàn tất lượt thử.');
    job.error = `${reason} Bước chưa gửi hoặc bị từ chối đã được hoàn hạn mức; bước hoàn tất hoặc chưa rõ trạng thái vẫn tính credit để tránh gọi trùng.`;
    console.error('Try-on:', error.message);
  } finally { persist(); busy.delete(job.userId); }
}
app.post('/api/stylist/tryon', authenticate, (req, res) => {
  const userId = req.user._id;
  const profile = db.profiles[userId];
  if (!profile) fail(400, 'Hãy tạo và lưu người mẫu trước.');
  if (!profile.composition) fail(409, 'Hãy thay ảnh người mẫu để dùng phông trắng và vùng ẩn mặt mới.');
  if (req.body.termsAccepted !== true) fail(400, 'Vui lòng đồng ý điều khoản thử đồ AI.');
  const submitted = req.body.measurements || {};
  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) fail(400, 'Số đo không hợp lệ.');
  const info = measurements(submitted);
  requireBodyBasics(info);
  const { productIds, requestId, regenerate = false } = req.body;
  if (typeof requestId !== 'string' || !/^[\w-]{16,80}$/.test(requestId) || typeof regenerate !== 'boolean') fail(400, 'Mã lượt thử không hợp lệ.');
  const existing = Object.values(db.jobs).find(j => j.userId === userId && j.requestId === requestId);
  if (existing) return res.json({ job: publicJob(existing), cached: true });
  const settings = tryonSettings(req.body.engine);
  const items = itemsFor(productIds, settings.engine === 'outfit' ? 4 : 3);
  const stepSettings = settings.engine === 'outfit' ? [settings] : items.map(p => settingsForProduct(p, settings.engine));
  const pipelineVersion = settings.engine === 'outfit' ? 'outfit-collage-v2' : 'outfits-v3';
  const cost = stepSettings.reduce((total, p) => total + p.credits, 0);
  db.bodyProfiles[userId] = info; persist();
  const base = JSON.stringify({ model: profile.id, items: items.map(p => [p._id, p.images[0]]), mode, apiModel: settings.model, quality: settings.quality, resolution: settings.resolution, adapter: pipelineVersion, steps: stepSettings, hidden: profile.hideFace ? profile.faceBox : null });
  const cacheKey = createHash('sha256').update(base).digest('hex');
  if (!regenerate) {
    const cached = Object.values(db.jobs).reverse().find(j => j.userId === userId && j.cacheKey === cacheKey && j.status === 'completed');
    if (cached) return res.json({ job: publicJob(cached), cached: true });
  }
  if (busy.has(userId)) fail(409, 'Đang xử lý một lượt. Vui lòng chờ để không tốn credit trùng.');
  if (mode === 'live' && !apiKey) fail(503, 'Backend chưa có FASHN_API_KEY.');
  if (!canReserve(db.usage, userId, mode, cost, globalLimit)) fail(429, 'Không đủ hạn mức (5 credit/ngày, 10/tháng) hoặc ngân sách demo đã hết.');
  const job = { id: randomUUID(), userId, modelId: profile.id, requestId, cacheKey, mode, inputPrivacy: profile.hideFace ? profile.faceBox : null, hideFace: !!profile.hideFace, faceBox: profile.faceBox, status: 'queued', productIds: items.map(p => p._id), productNames: items.map(p => p.title), cost, engine: settings.engine, quality: settings.quality, resolution: settings.resolution, totalSteps: stepSettings.length, creditsPerItem: settings.engine !== 'outfit' && stepSettings.every(p => p.credits === settings.credits) ? settings.credits : null, itemCredits: stepSettings.map(p => p.credits), pipelineVersion, stepModels: stepSettings.map(p => p.model), seed: regenerate ? randomBytes(4).readUInt32BE() : 42, step: 0, stepsCompleted: 0, consentVersion, consentAt: new Date().toISOString(), createdAt: new Date().toISOString(), reservations: [] };
  for (let index = 0; index < stepSettings.length; index++) for (let unit = 0; unit < stepSettings[index].credits; unit++) {
    const p = items[index];
    const entry = { id: randomUUID(), userId, mode, productId: p._id, ...(settings.engine === 'outfit' ? { productIds: items.map(item => item._id) } : {}), ...periods(), jobId: job.id, refunded: false };
    db.usage.push(entry); job.reservations.push(entry.id);
  }
  db.jobs[job.id] = job;
  busy.add(userId); persist();
  res.status(202).json({ job: publicJob(job), cached: false });
  void runJob(job, profile, items, stepSettings);
});
app.get('/api/stylist/jobs/:id', authenticate, (req, res) => {
  const job = db.jobs[req.params.id];
  if (!job || job.userId !== req.user._id) fail(404, 'Không tìm thấy lượt thử.');
  res.json({ job: publicJob(job), quota: quota(db.usage, req.user._id, mode) });
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error instanceof multer.MulterError ? 400 : error.status || (error instanceof SyntaxError ? 400 : 500);
  if (status === 500) console.error(error);
  res.status(status).json({ error: error instanceof multer.MulterError ? 'Ảnh quá lớn; giới hạn 8 MB.' : status === 500 ? 'Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại.' : error.message });
});
export const server = app.listen(port, '127.0.0.1', () => console.log(`SiFit Stylist API: http://127.0.0.1:${port} (${mode})`));
