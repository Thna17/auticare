import { describe, expect, it } from 'vitest';
import { grantsAccess, isOngoing, pickCurrent } from './subscriptions.access.js';

const now = new Date('2026-10-28T12:00:00.000Z');
const past = new Date('2026-10-01T00:00:00.000Z');
const future = new Date('2026-12-01T00:00:00.000Z');

describe('grantsAccess', () => {
  it('ACTIVE grants access until the paid-through date, or forever without one', () => {
    expect(grantsAccess({ status: 'ACTIVE', currentPeriodEnd: null }, now)).toBe(true);
    expect(grantsAccess({ status: 'ACTIVE', currentPeriodEnd: future }, now)).toBe(true);
    expect(grantsAccess({ status: 'ACTIVE', currentPeriodEnd: past }, now)).toBe(false);
  });

  it('CANCELED keeps access only until the paid-through date', () => {
    expect(grantsAccess({ status: 'CANCELED', currentPeriodEnd: future }, now)).toBe(true);
    expect(grantsAccess({ status: 'CANCELED', currentPeriodEnd: past }, now)).toBe(false);
    expect(grantsAccess({ status: 'CANCELED', currentPeriodEnd: null }, now)).toBe(false);
  });

  it('PAST_DUE and EXPIRED give no access (no grace period is assumed)', () => {
    expect(grantsAccess({ status: 'PAST_DUE', currentPeriodEnd: future }, now)).toBe(false);
    expect(grantsAccess({ status: 'EXPIRED', currentPeriodEnd: future }, now)).toBe(false);
  });
});

describe('isOngoing', () => {
  it('treats PAST_DUE as still running so a second plan is not stacked on it', () => {
    expect(isOngoing({ status: 'PAST_DUE', currentPeriodEnd: past }, now)).toBe(true);
    expect(isOngoing({ status: 'EXPIRED', currentPeriodEnd: future }, now)).toBe(false);
    expect(isOngoing({ status: 'CANCELED', currentPeriodEnd: past }, now)).toBe(false);
  });
});

describe('pickCurrent', () => {
  it('prefers the subscription that grants access over a newer lapsed one', () => {
    const lapsed = { id: 'b', status: 'EXPIRED' as const, currentPeriodEnd: null };
    const live = { id: 'a', status: 'ACTIVE' as const, currentPeriodEnd: null };
    expect(pickCurrent([lapsed, live], now)?.id).toBe('a');
    expect(pickCurrent([lapsed], now)?.id).toBe('b');
    expect(pickCurrent([], now)).toBeNull();
  });
});
