import { describe, expect, it } from 'vitest';
import { expiryBucket } from './inventory-overview-stock';
const now = Date.parse('2026-03-07T20:00:00Z');
describe('expiryBucket', () => {
  it('matches the existing fourteen calendar-day expiry boundary', () => {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 14);
    expect(expiryBucket({ quantity: 1, expirationDate: new Date(now) }, now)).toBe('expired');
    expect(expiryBucket({ quantity: 1, expirationDate: cutoff }, now)).toBe('expiring');
    expect(expiryBucket({ quantity: 1, expirationDate: new Date(cutoff.getTime() + 1) }, now)).toBe(
      'fresh',
    );
  });
  it('keeps missing and invalid dates separate from dated stock', () => {
    expect(expiryBucket({ quantity: 1 }, now)).toBe('undated');
    expect(expiryBucket({ quantity: 1, expirationDate: new Date('invalid') }, now)).toBe('undated');
    expect(expiryBucket({ quantity: 0, expirationDate: new Date(now) }, now)).toBe('empty');
    expect(expiryBucket({ quantity: -1 }, now)).toBe('empty');
  });
  it('compares equivalent timezone timestamps as instants across daylight saving', () => {
    expect(
      expiryBucket({ quantity: 1, expirationDate: new Date('2026-03-14T13:00:00-07:00') }, now),
    ).toBe('expiring');
    expect(
      expiryBucket({ quantity: 1, expirationDate: new Date('2026-03-14T20:00:00Z') }, now),
    ).toBe('expiring');
  });
});
