import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBasicBazi } from '../src/core.js';
import { renderBasicBaziSvg, renderBasicBaziPng } from '../src/image.js';

const chart = calculateBasicBazi({
  calendar: { type: 'solar' }, date: { year: 1988, month: 8, day: 9 },
  time: { hour: 21, minute: 30 }, location: { timezone: 'Asia/Shanghai' },
});

test('export preserves the complete chosen chart dimensions and genuine counts', () => {
  const svg = renderBasicBaziSvg(chart, 'zh-CN', { redactBirthDetails: true });
  for (const label of ['四柱命盘', '天干十神', '地支藏干', '藏干十神', '神煞组合', '华盖逢空', '五行分布', '十神占比', '未加权']) assert.ok(svg.includes(label), label);
  assert.match(svg, /Yuanzi Chart Serif/);
  assert.match(svg, /data-role="day-column"[^>]*fill="#f7e8e3"/);
  for (const g of chart.structure!.tenGods) assert.ok(svg.includes(`${g.percent}%`));
  assert.equal(renderBasicBaziPng(chart).readUInt32BE(16), 2160);
});

test('five generating and five controlling edges have exactly one directed arrow each', () => {
  const svg = renderBasicBaziSvg(chart);
  const edges = [...svg.matchAll(/<path[^>]*data-edge="([^"]+)"[^>]*>/g)].map(m => m[0]);
  assert.equal(edges.length, 10);
  for (const edge of edges) {
    assert.match(edge, /marker-end=/);
    assert.doesNotMatch(edge, /marker-start=/);
  }
  for (const key of ['generate:wood:fire', 'generate:fire:earth', 'generate:earth:metal', 'generate:metal:water', 'generate:water:wood', 'control:wood:earth', 'control:earth:water', 'control:water:fire', 'control:fire:metal', 'control:metal:wood']) assert.ok(svg.includes(`data-edge="${key}"`));
});

test('bar lengths use one scale and render zeros without fake visible stubs', () => {
  const svg = renderBasicBaziSvg(chart);
  const bars = [...svg.matchAll(/<rect[^>]*data-bar="([^"]+)"[^>]*width="([\d.]+)"/g)];
  assert.equal(bars.length, 10);
  const nonzeroRatios = bars.flatMap(m => {
    const god = chart.structure!.tenGods.find(g => g.name === m[1])!;
    if (!god.count) { assert.equal(Number(m[2]), 0); return []; }
    return [Number(m[2]) / god.percent];
  });
  assert.ok(Math.max(...nonzeroRatios) - Math.min(...nonzeroRatios) < 0.01);
});

test('older saved v1 output can be rendered without an extension field', () => {
  const old = structuredClone(chart);
  delete old.structure;
  assert.equal(renderBasicBaziSvg(old), renderBasicBaziSvg(chart));
});

test('traditional labels include calendar, rules and footer conversions', () => {
  const svg = renderBasicBaziSvg(chart, 'zh-Hant');
  for (const text of ['農曆', '固定規則', '同柱共現', '參考', '結構一覽', '預測']) assert.ok(svg.includes(text), text);
  assert.doesNotMatch(svg, /农|规|现|参|览|结|预/);
});

test('a composition above 50 percent expands the scale without overflowing the track', () => {
  const concentrated = structuredClone(chart);
  concentrated.structure!.tenGods.forEach((g, i) => { g.percent = i === 0 ? 62.5 : 0; });
  const svg = renderBasicBaziSvg(concentrated);
  assert.match(svg, />75%<\/text>/);
  const firstBar = svg.match(/<rect[^>]*data-bar="比肩"[^>]*width="([\d.]+)"/)!;
  assert.ok(Math.abs(Number(firstBar[1]) - 191 * 62.5 / 75) < 0.01);
});

test('all three locales preserve rules, known/unknown status and safe SVG text', () => {
  const unknown = calculateBasicBazi({
    calendar: { type: 'solar' }, date: { year: 1988, month: 8, day: 9 },
    time: { hour: null, minute: null }, location: { timezone: 'Asia/Shanghai' },
  });
  for (const locale of ['zh-CN', 'zh-Hant', 'en'] as const) {
    const svg = renderBasicBaziSvg(unknown, locale);
    assert.match(svg, /未计算|未計算|Not calculated/);
    assert.match(svg, /hour_unknown/);
    assert.match(svg, /<image data-role="brand-mark"/);
    assert.doesNotMatch(svg.replace(/<image data-role="brand-mark"[^>]*\/>/, ''), /<script|<image|(?:href|src)=/);
    assert.ok(renderBasicBaziPng(unknown, locale).length > 10_000);
  }
  const unsafe = structuredClone(chart);
  unsafe.time.timezone = '<script>alert("x")</script>&';
  const svg = renderBasicBaziSvg(unsafe);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;/);
});
