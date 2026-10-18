import { periods } from './quota.mjs';
export const demoControlsEnabled = (mode, env = process.env) => mode === 'demo' && env.NODE_ENV !== 'production' && env.SIFIT_DEMO_CONTROLS !== 'false';

export function resetDemoAllowance(db, userId, now = new Date()) {
  const { day, month } = periods(now);
  // Retain the ledger for review; only the current member's demo allowance resets.
  for (const entry of db.usage) {
    if (entry.userId === userId && entry.mode === 'demo' && entry.month === month) {
      entry.refunded = true;
      entry.demoResetAt = now.toISOString();
    }
  }
  db.modelAttempts = db.modelAttempts.filter(entry => entry.userId !== userId || entry.day !== day);
}
