import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { calculateBasicBazi } from '../src/core.js';
import { renderBasicBaziPng, renderBasicBaziSvg } from '../src/image.js';

const chart = calculateBasicBazi({
  calendar: { type: 'solar' },
  date: { year: 1988, month: 8, day: 9 },
  time: { hour: 2, minute: 53 },
  location: { timezone: 'Asia/Shanghai' },
});
test('image is deterministic PNG with the same factual pillars and visible limitations', () => {
  for (const locale of ['zh-CN', 'zh-Hant', 'en'] as const) {
    const svg = renderBasicBaziSvg(chart, locale);
    for (const pillar of Object.values(chart.pillars))
      assert.ok(svg.includes(pillar!.stem.value));
    assert.match(svg, /unweighted|未加权|未加權/);
    const images = [...svg.matchAll(/<image\b[^>]*href="data:image\/png;base64,([A-Za-z0-9+/=]+)"[^>]*\/>/g)];
    assert.equal(images.length, 1);
    assert.deepEqual(Buffer.from(images[0][1], 'base64'), readFileSync(new URL('../assets/yuanzi-logo-mark.png', import.meta.url)));
    assert.doesNotMatch(svg.replace(images[0][0], ''), /<script|<image|(?:href|src)=/);
    const png = renderBasicBaziPng(chart, locale);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 2160);
    assert.ok(png.length < 1_000_000);
    assert.deepEqual(png, renderBasicBaziPng(chart, locale));
  }
});
test('unknown hour and warnings are displayed without fabricating a pillar', () => {
  const unknown = calculateBasicBazi({
    calendar: { type: 'solar' },
    date: { year: 1988, month: 8, day: 9 },
    time: { hour: null, minute: null },
    location: { timezone: 'Asia/Shanghai' },
  });
  const svg = renderBasicBaziSvg(unknown, 'en');
  assert.match(svg, /Unknown/);
  assert.match(svg, /Birth hour unknown/);
  assert.doesNotMatch(svg, /己/);
});

test('unknown minutes and solar-time boundaries are visibly qualified', () => {
  const input = {
    calendar: { type: 'solar' as const },
    date: { year: 1988, month: 8, day: 9 },
    time: { hour: 2, minute: null },
    location: { timezone: 'Asia/Shanghai' },
  };
  const result = calculateBasicBazi(input);
  assert.match(renderBasicBaziSvg(result, 'en'), /02:\?\?/);
  assert.match(renderBasicBaziSvg(result, 'en'), /calculation assumes 00/);
  const unknown = calculateBasicBazi({
    ...input,
    time: { hour: null, minute: null },
    location: { timezone: 'Asia/Shanghai', longitude: 121.47 },
    options: { timeCorrection: 'trueSolar' },
  });
  assert.match(
    renderBasicBaziSvg(unknown, 'en'),
    /True solar correction skipped/,
  );
  assert.ok(renderBasicBaziPng(unknown, 'en').readUInt32BE(20)
    > renderBasicBaziPng({ ...unknown, warnings: [] }, 'en').readUInt32BE(20));
});

test('public example redaction removes birth and adjusted dates, clocks and timezone', () => {
  for (const locale of ['zh-CN', 'zh-Hant', 'en'] as const) {
    const svg = renderBasicBaziSvg(chart, locale, { redactBirthDetails: true });
    assert.doesNotMatch(svg, /1988|08-09|02:53|01:53|Asia\/Shanghai/);
    assert.match(svg, /\*\*\*\*-\*\*-\*\*/);
    assert.ok(svg.includes(chart.pillars.day.stem.value));
    assert.ok(
      renderBasicBaziPng(chart, locale, { redactBirthDetails: true }).length >
        10_000,
    );
  }
});
