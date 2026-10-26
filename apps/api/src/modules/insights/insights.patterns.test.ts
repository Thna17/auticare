import { describe, expect, it } from 'vitest';
import type { ObservationCategory } from '@auticare/contracts';
import { analyzeObservations } from './insights.patterns.js';

const row = (occurredAt: string, category: ObservationCategory = 'SLEEP', intensity = 3) => ({
  category,
  intensity,
  occurredAt: new Date(occurredAt),
});

// 2026-10-19 is a Monday. Times below are UTC unless a test says otherwise.
const MONDAY_9AM = '2026-10-19T09:00:00.000Z';

describe('analyzeObservations', () => {
  it('returns nothing to show when nothing was recorded', () => {
    const result = analyzeObservations({ rows: [], previousRows: [], tzOffsetMinutes: 0 });
    expect(result.patterns).toEqual([]);
    expect(result.observationCount).toBe(0);
    expect(result.summary).toMatch(/No observations/);
  });

  it('counts, averages intensity and shares per category', () => {
    const result = analyzeObservations({
      rows: [
        row(MONDAY_9AM, 'SLEEP', 2),
        row(MONDAY_9AM, 'SLEEP', 4),
        row(MONDAY_9AM, 'SENSORY', 5),
      ],
      previousRows: [],
      tzOffsetMinutes: 0,
    });

    const sleep = result.patterns.find((pattern) => pattern.category === 'SLEEP');
    expect(sleep).toBeDefined();
    expect(sleep?.count).toBe(2);
    expect(sleep?.share).toBeCloseTo(0.67, 1);
    expect(sleep?.averageIntensity).toBe(3);
    expect(result.distinctDays).toBe(1);
  });

  it('marks a category as new when it did not appear in the previous window', () => {
    const result = analyzeObservations({
      rows: [row(MONDAY_9AM), row(MONDAY_9AM)],
      previousRows: [],
      tzOffsetMinutes: 0,
    });
    expect(result.patterns[0]?.trend).toBe('NEW');
  });

  it('detects an increase and a decrease against the previous window', () => {
    const increase = analyzeObservations({
      rows: [row(MONDAY_9AM), row(MONDAY_9AM), row(MONDAY_9AM), row(MONDAY_9AM)],
      previousRows: [row(MONDAY_9AM)],
      tzOffsetMinutes: 0,
    });
    expect(increase.patterns[0]?.trend).toBe('INCREASED');

    const decrease = analyzeObservations({
      rows: [row(MONDAY_9AM)],
      previousRows: [row(MONDAY_9AM), row(MONDAY_9AM), row(MONDAY_9AM), row(MONDAY_9AM)],
      tzOffsetMinutes: 0,
    });
    expect(decrease.patterns[0]?.trend).toBe('DECREASED');
  });

  it('finds a weekday cluster', () => {
    const rows = [
      row('2026-10-19T09:00:00.000Z'),
      row('2026-10-20T09:00:00.000Z'),
      row('2026-10-21T09:00:00.000Z'),
      row('2026-10-17T09:00:00.000Z'), // Saturday
    ];
    const result = analyzeObservations({ rows, previousRows: [], tzOffsetMinutes: 0 });
    const sleep = result.patterns[0];
    expect(sleep?.weekdayCount).toBe(3);
    expect(sleep?.weekendCount).toBe(1);
    expect(result.summary).toMatch(/clusters on weekdays/);
  });

  it('files a late-night record against the parent’s local day, not the server’s', () => {
    // 23:30 UTC on Sunday is 06:30 Monday in Phnom Penh (+07:00).
    const lateNight = row('2026-10-18T23:30:00.000Z');

    const utc = analyzeObservations({ rows: [lateNight], previousRows: [], tzOffsetMinutes: 0 });
    expect(utc.patterns[0]?.weekendCount).toBe(1);

    const phnomPenh = analyzeObservations({
      rows: [lateNight],
      previousRows: [],
      tzOffsetMinutes: 420,
    });
    expect(phnomPenh.patterns[0]?.weekdayCount).toBe(1);
    expect(phnomPenh.patterns[0]?.weekendCount).toBe(0);
    expect(phnomPenh.patterns[0]?.timeOfDay).toBe('MORNING');
  });

  it('reports a time-of-day cluster only when it really is a cluster', () => {
    const clustered = analyzeObservations({
      rows: [
        row('2026-10-19T20:00:00.000Z'),
        row('2026-10-20T20:00:00.000Z'),
        row('2026-10-21T20:00:00.000Z'),
      ],
      previousRows: [],
      tzOffsetMinutes: 0,
    });
    expect(clustered.patterns[0]?.timeOfDay).toBe('EVENING');

    const scattered = analyzeObservations({
      rows: [
        row('2026-10-19T06:00:00.000Z'),
        row('2026-10-20T13:00:00.000Z'),
        row('2026-10-21T20:00:00.000Z'),
      ],
      previousRows: [],
      tzOffsetMinutes: 0,
    });
    expect(scattered.patterns[0]?.timeOfDay).toBeNull();
  });

  it('orders categories by how often they were recorded', () => {
    const result = analyzeObservations({
      rows: [row(MONDAY_9AM, 'SENSORY'), row(MONDAY_9AM, 'SLEEP'), row(MONDAY_9AM, 'SLEEP')],
      previousRows: [],
      tzOffsetMinutes: 0,
    });
    expect(result.patterns.map((pattern) => pattern.category)).toEqual(['SLEEP', 'SENSORY']);
  });
});
