import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateBasicBazi, formatBasicBaziText } from '../src/index.ts';

const chartFor = (day: number, hour: number | null = 2) => calculateBasicBazi({
  calendar: { type: 'solar' },
  date: { year: 1988, month: 8, day },
  time: { hour, minute: hour === null ? null : 53 },
  location: { timezone: 'Asia/Shanghai' },
});

test('text formatter localizes English, simplified, and traditional output', () => {
  const base = chartFor(9);
  const yin = chartFor(10);
  const unknown = chartFor(9, null);

  assert.match(formatBasicBaziText(base, 'zh-CN'), /排盘口径：standard · ziEarly/);
  assert.match(formatBasicBaziText(base, 'zh-CN'), /提示：无/);
  assert.match(formatBasicBaziText(yin, 'zh-Hant'), /排盤口徑：standard · ziEarly/);
  assert.match(formatBasicBaziText(yin, 'zh-Hant'), /、陰）/);
  assert.match(formatBasicBaziText(base, 'zh-Hant'), /提示：無/);
  assert.match(formatBasicBaziText(unknown, 'en'), /unknown/);
  assert.match(formatBasicBaziText(unknown, 'en'), /Warnings: hour_unknown/);
  assert.match(formatBasicBaziText(base, 'en'), /Warnings: none/);
});
