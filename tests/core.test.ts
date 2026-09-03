import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BASIC_BAZI_SCHEMA_VERSION,
  BasicBaziError,
  calculateBasicBazi,
  type BasicBaziInput,
} from '../src/index.ts';

const baseInput = (overrides: Partial<BasicBaziInput> = {}): BasicBaziInput => ({
  calendar: { type: 'solar' },
  date: { year: 1988, month: 8, day: 9 },
  time: { hour: 2, minute: 53 },
  location: { timezone: 'Asia/Shanghai' },
  options: { timeCorrection: 'standard', dayBoundary: 'ziEarly' },
  ...overrides,
});

test('calculates a versioned privacy-minimized basic chart', () => {
  const result = calculateBasicBazi(baseInput());

  assert.equal(result.schemaVersion, BASIC_BAZI_SCHEMA_VERSION);
  assert.deepEqual(
    [result.pillars.year.name, result.pillars.month.name, result.pillars.day.name, result.pillars.hour?.name],
    ['戊辰', '庚申', '丙申', '己丑'],
  );
  assert.deepEqual(result.dayMaster, {
    value: '丙',
    element: 'fire',
    yinYang: 'yang',
  });
  assert.equal(result.pillars.year.stem.tenGod, '食神');
  assert.equal(result.pillars.month.stem.tenGod, '偏财');
  assert.equal(result.pillars.day.stem.tenGod, 'dayMaster');
  assert.deepEqual(
    result.pillars.year.branch.hiddenStems.map(({ value }) => value),
    ['戊', '乙', '癸'],
  );
  assert.equal(result.fiveElements.method, 'unweighted-visible-and-hidden-counts');
  assert.equal(JSON.stringify(result).includes('基准命例'), false);
  assert.equal(JSON.stringify(result).includes('gender'), false);
});

test('keeps Zi-hour and midnight day boundaries explicit', () => {
  const lateZi = baseInput({
    date: { year: 1983, month: 12, day: 8 },
    time: { hour: 23, minute: 30 },
  });

  const ziEarly = calculateBasicBazi(lateZi);
  const midnight = calculateBasicBazi({
    ...lateZi,
    options: { ...lateZi.options, dayBoundary: 'midnight' },
  });

  assert.deepEqual(
    [ziEarly.pillars.day.name, ziEarly.pillars.hour?.name],
    ['辛未', '戊子'],
  );
  assert.deepEqual(
    [midnight.pillars.day.name, midnight.pillars.hour?.name],
    ['庚午', '丙子'],
  );
  assert.equal(ziEarly.conventions.dayBoundary, 'ziEarly');
  assert.equal(midnight.conventions.dayBoundary, 'midnight');
});

test('supports lunar leap metadata and emits the converted solar and lunar dates', () => {
  const result = calculateBasicBazi(baseInput({
    calendar: { type: 'lunar', isLeapMonth: false },
    date: { year: 1983, month: 11, day: 5 },
    time: { hour: 23, minute: 30 },
  }));

  assert.equal(result.calendar.solar.text, '1983-12-08 23:30:00');
  assert.equal(result.calendar.lunar.text, '一九八三年冬月初五');
  assert.equal(result.calendar.lunar.isLeapMonth, false);
  assert.equal(result.pillars.day.name, '辛未');
});

test('applies true solar time with a reviewable correction breakdown', () => {
  const result = calculateBasicBazi(baseInput({
    date: { year: 1983, month: 12, day: 8 },
    time: { hour: 22, minute: 30 },
    location: { timezone: 'Asia/Shanghai', longitude: 130.969 },
    options: { timeCorrection: 'trueSolar', dayBoundary: 'ziEarly' },
  }));

  assert.equal(result.time.adjusted.text, '1983-12-08 23:21:00');
  assert.equal(result.time.boundaryChanged, true);
  assert.equal(result.time.correction?.timezoneOffsetMinutes, 480);
  assert.equal(result.time.correction?.referenceMeridianLongitude, 120);
  assert.ok(Math.abs((result.time.correction?.longitudeCorrectionMinutes ?? 0) - 43.876) < 0.001);
  assert.equal(result.time.correction?.totalCorrectionMinutes, 51);
  assert.deepEqual(
    [result.pillars.day.name, result.pillars.hour?.name],
    ['辛未', '戊子'],
  );
});

test('does not invent an hour pillar and marks minute-only uncertainty', () => {
  const unknownHour = calculateBasicBazi(baseInput({ time: { hour: null, minute: null } }));
  const unknownMinute = calculateBasicBazi(baseInput({ time: { hour: 2, minute: null } }));

  assert.equal(unknownHour.pillars.hour, null);
  assert.ok(unknownHour.warnings.some(({ code }) => code === 'hour_unknown'));
  assert.ok(unknownHour.warnings.some(({ code }) => code === 'late_zi_day_uncertain'));
  assert.equal(unknownMinute.time.recorded.assumedMinute, 0);
  assert.ok(unknownMinute.warnings.some(({ code }) => code === 'minute_unknown_assumed_zero'));
});

test('keeps true-solar intent explicit when the hour is unknown without applying it', () => {
  const result = calculateBasicBazi(baseInput({
    time: { hour: null, minute: null },
    location: { timezone: 'Asia/Shanghai', longitude: 121.4737 },
    options: { timeCorrection: 'trueSolar', dayBoundary: 'ziEarly' },
  }));

  assert.equal(result.conventions.timeCorrection, 'trueSolar');
  assert.equal(result.time.adjusted.text, result.time.recorded.text);
  assert.ok(result.time.correction);
  assert.ok(result.warnings.some(({ code }) => code === 'true_solar_skipped_hour_unknown'));
});

test('applies documented defaults when optional conventions are omitted', () => {
  const input = baseInput();
  delete input.options;
  const result = calculateBasicBazi(input);

  assert.deepEqual(result.conventions, { timeCorrection: 'standard', dayBoundary: 'ziEarly' });
  assert.equal(result.time.correction, null);
  assert.equal(result.time.boundaryChanged, false);
});

test('fails closed for invalid time zones, DST gaps, overlaps, and missing longitude', () => {
  const expectCode = (input: BasicBaziInput, code: string) => {
    assert.throws(
      () => calculateBasicBazi(input),
      (error: unknown) => error instanceof BasicBaziError && error.code === code,
    );
  };

  expectCode(baseInput({ location: { timezone: 'Invalid/Timezone' } }), 'timezone_invalid');
  expectCode(baseInput({
    date: { year: 2024, month: 3, day: 10 },
    time: { hour: 2, minute: 30 },
    location: { timezone: 'America/New_York', longitude: -74.006 },
    options: { timeCorrection: 'trueSolar', dayBoundary: 'ziEarly' },
  }), 'dst_gap');
  expectCode(baseInput({
    date: { year: 2024, month: 11, day: 3 },
    time: { hour: 1, minute: 30 },
    location: { timezone: 'America/New_York', longitude: -74.006 },
    options: { timeCorrection: 'trueSolar', dayBoundary: 'ziEarly' },
  }), 'dst_overlap');
  expectCode(baseInput({
    options: { timeCorrection: 'trueSolar', dayBoundary: 'ziEarly' },
  }), 'longitude_required');
});

test('rejects identity fields, unknown nested fields, and unsupported conventions at runtime', () => {
  const expectInvalid = (input: unknown) => {
    assert.throws(
      () => calculateBasicBazi(input as BasicBaziInput),
      (error: unknown) => error instanceof BasicBaziError && error.code === 'input_invalid',
    );
  };

  expectInvalid({ ...baseInput(), name: '不应接收' });
  expectInvalid({ ...baseInput(), location: { timezone: 'Asia/Shanghai', city: '不应接收' } });
  expectInvalid({ ...baseInput(), options: { timeCorrection: 'magic', dayBoundary: 'ziEarly' } });
  expectInvalid({ ...baseInput(), options: { timeCorrection: 'standard', dayBoundary: 'sunset' } });
});

test('validates malformed calendar, date, time, and location values with typed errors', () => {
  const expectCode = (input: unknown, code: string) => {
    assert.throws(
      () => calculateBasicBazi(input as BasicBaziInput),
      (error: unknown) => error instanceof BasicBaziError && error.code === code,
    );
  };

  expectCode(null, 'input_invalid');
  expectCode({ ...baseInput(), calendar: 'solar' }, 'input_invalid');
  expectCode({ ...baseInput(), calendar: { type: 'gregorian' } }, 'calendar_invalid');
  expectCode({ ...baseInput(), calendar: { type: 'solar', isLeapMonth: 'yes' } }, 'calendar_invalid');
  expectCode({ ...baseInput(), calendar: { type: 'solar', isLeapMonth: true } }, 'calendar_invalid');
  expectCode({ ...baseInput(), date: { year: 1988, month: 2, day: 30 } }, 'date_invalid');
  expectCode({ ...baseInput(), date: { year: 0, month: 8, day: 9 } }, 'date_invalid');
  expectCode({ ...baseInput(), time: { hour: null, minute: 0 } }, 'time_invalid');
  expectCode({ ...baseInput(), time: { hour: 24, minute: 0 } }, 'time_invalid');
  expectCode({ ...baseInput(), time: { hour: 2, minute: 60 } }, 'time_invalid');
  expectCode({ ...baseInput(), location: { timezone: '' } }, 'timezone_invalid');
  expectCode({ ...baseInput(), location: { timezone: 'Asia/Shanghai', longitude: 181 } }, 'longitude_invalid');
  expectCode({ ...baseInput(), location: { timezone: 'Asia/Shanghai', longitude: Number.NaN } }, 'longitude_invalid');
});
