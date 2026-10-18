import test from 'node:test';
import assert from 'node:assert/strict';
import { periods, quota, canReserve } from './quota.mjs';
const at = new Date('2026-10-12T05:00:00Z');
const entry = (overrides = {}) => ({ userId: 'a', mode: 'live', ...periods(at), refunded: false, ...overrides });
test('Vietnam midnight and month boundary', () => {
  assert.deepEqual(periods(new Date('2026-10-31T16:59:59Z')), { day: '2026-10-31', month: '2026-10' });
  assert.deepEqual(periods(new Date('2026-10-31T17:00:00Z')), { day: '2026-11-01', month: '2026-11' });
});
test('five daily credits, ten monthly; refunds, other accounts and demo isolated', () => {
  const usage = [...Array.from({ length: 4 }, () => entry()), entry({ refunded: true }), entry({ userId: 'b' }), entry({ mode: 'demo' })];
  assert.equal(quota(usage, 'a', 'live', at).remaining, 1);
  assert.equal(canReserve(usage, 'a', 'live', 2, 100, at), false);
  usage.push(entry());
  assert.equal(quota(usage, 'a', 'live', at).remaining, 0);
  usage.push(...Array.from({ length: 5 }, () => entry({ day: '2026-10-11' })));
  assert.equal(quota(usage, 'a', 'live', new Date('2026-10-13T05:00:00Z')).remaining, 0);
  assert.equal(quota(usage, 'a', 'live', new Date('2026-11-01T05:00:00Z')).remaining, 5);
});
test('whole outfit reserved within global budget before any call', () => {
  assert.equal(canReserve([entry({ userId: 'b' })], 'a', 'live', 3, 3, at), false);
  assert.equal(canReserve([], 'a', 'live', 3, 3, at), true);
  assert.equal(canReserve([], 'a', 'live', 0, 100, at), false);
});
