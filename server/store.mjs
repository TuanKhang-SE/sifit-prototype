import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { MOCK_USERS } from '../src/data/mockData.js';

export const dataDir = path.resolve(process.env.SIFIT_DATA_DIR || 'server/data');
mkdirSync(dataDir, { recursive: true });
const file = path.join(dataDir, 'store.json');
export const passwordHash = password => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};
export function passwordMatches(password, hash) {
  const [salt, value] = hash.split(':');
  return timingSafeEqual(Buffer.from(value, 'hex'), scryptSync(password, salt, 64));
}
export function publicUser(user) {
  const { password: _password, hash: _hash, ...safe } = user;
  return safe;
}
export let db;
try { db = JSON.parse(readFileSync(file, 'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  db = { users: MOCK_USERS.map(({ password, ...user }) => ({ ...user, hash: passwordHash(password) })), sessions: {}, profiles: {}, drafts: {}, jobs: {}, usage: [], modelAttempts: [] };
}
export function persist() {
  writeFileSync(`${file}.tmp`, JSON.stringify(db));
  renameSync(`${file}.tmp`, file);
}
// Never replay an uncertain paid request after a process restart. Its reservation
// remains charged, since the provider may already have generated an image.
for (const job of Object.values(db.jobs)) {
  if (['queued', 'running'].includes(job.status)) {
    job.status = 'failed';
    for (const id of job.reservations.slice(job.submittedCredits ?? job.step ?? 0)) {
      const reservation = db.usage.find(u => u.id === id);
      if (reservation) reservation.refunded = true;
    }
    job.error = 'Máy chủ vừa khởi động lại. Lượt đã gửi được giữ hạn mức để tránh gọi AI trùng. Hãy kiểm tra kết quả hoặc thử lại sau.';
  }
}
persist();
