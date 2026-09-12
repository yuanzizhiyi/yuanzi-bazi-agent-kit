import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBasicBazi } from '../src/core.js';
import { analyzeBasicBaziStructure } from '../src/chart-structure.js';
import { basicBaziResultSchema } from '../src/schemas.js';
import { STEM_PROFILES } from '../src/metadata.js';

const input = {
  calendar: { type: 'solar' as const },
  date: { year: 1988, month: 8, day: 9 },
  time: { hour: 21, minute: 30 },
  location: { timezone: 'Asia/Shanghai' },
};

test('statistics count each visible and hidden stem once without double-counting branches', () => {
  const chart = calculateBasicBazi(input);
  assert.deepEqual(Object.values(chart.pillars).map(p => p?.name), ['戊辰', '庚申', '丙申', '己亥']);
  const result = analyzeBasicBaziStructure(chart);
  assert.equal(result.method, 'equal-stem-occurrence/v1');
  assert.equal(result.total, 15);
  assert.deepEqual(result.elements.map(e => [e.element, e.count]), [
    ['wood', 2], ['fire', 1], ['earth', 5], ['metal', 3], ['water', 4],
  ]);
  assert.deepEqual(result.tenGods.map(g => g.count), [1, 0, 4, 1, 0, 3, 1, 3, 1, 1]);
  assert.equal(result.tenGods.reduce((n, g) => n + Math.round(g.percent * 10), 0), 1000);
  assert.equal(result.elements.reduce((n, e) => n + Math.round(e.percent * 10), 0), 1000);
  for (const e of result.elements) {
    const gods = result.tenGods.filter(g => e.tenGods.includes(g.name));
    assert.equal(gods.reduce((n, g) => n + g.count, 0), e.count);
    assert.equal(gods.reduce((n, g) => n + Math.round(g.percent * 10), 0), Math.round(e.percent * 10));
  }
  assert.deepEqual(chart.structure, result);
  assert.equal(basicBaziResultSchema.safeParse(chart).success, true);
});

test('reference pillars produce deduplicated shensha with rule evidence and genuine co-occurrences', () => {
  const s = analyzeBasicBaziStructure(calculateBasicBazi(input)).shensha;
  assert.equal(s.ruleSet, 'yuanzi-shensha/v1');
  assert.deepEqual(s.pillars.year.matches.map(m => m.name), ['太极贵人', '华盖', '天德合', '空亡']);
  assert.deepEqual(s.pillars.year.combinations.map(c => c.name), ['华盖逢空', '华盖太极同宫']);
  assert.deepEqual(s.pillars.month.matches.map(m => m.name), ['文昌贵人']);
  assert.deepEqual(s.pillars.day.matches.map(m => m.name), ['文昌贵人']);
  assert.deepEqual(s.pillars.hour.matches.map(m => m.name), ['天乙贵人', '亡神', '红鸾']);
  const canopy = s.pillars.year.matches.find(m => m.id === 'hua_gai')!;
  assert.deepEqual(canopy.basis.map(b => b.pillar), ['year', 'day']);
  assert.ok(Object.values(s.pillars).every(p => p.matches.every(m => m.basis.length > 0)));
});

test('unknown hour stays unknown and is omitted from statistics and shensha', () => {
  const chart = calculateBasicBazi({ ...input, time: { hour: null, minute: null } });
  const s = analyzeBasicBaziStructure(chart);
  assert.equal(s.total, 12);
  assert.deepEqual(s.shensha.pillars.hour, { status: 'hour_unknown', matches: [], combinations: [] });
  assert.equal(s.tenGods.reduce((sum, g) => sum + g.count, 0), 12);
  assert.ok(chart.warnings.some(w => w.code === 'hour_unknown'));
});

test('all ten day masters map elements to the correct paired ten gods', () => {
  const dayElements: string[] = [];
  for (let day = 1; day <= 10; day++) {
    const chart = calculateBasicBazi({ ...input, date: { year: 2000, month: 1, day } });
    const stats = analyzeBasicBaziStructure(chart);
    dayElements.push(chart.dayMaster.value);
    assert.deepEqual(stats.elements.find(e => e.element === chart.dayMaster.element)?.tenGods, ['比肩', '劫财']);
    assert.equal(stats.elements.flatMap(e => e.tenGods).length, 10);
    assert.equal(new Set(stats.elements.flatMap(e => e.tenGods)).size, 10);
    for (const god of stats.tenGods) assert.ok(god.count >= 0 && god.percent >= 0 && god.percent <= 100);
  }
  assert.equal(new Set(dayElements).size, Object.keys(STEM_PROFILES).length);
});

test('every sexagenary day has exactly the two correct xun-empty branches', () => {
  // Build branch-only test columns from real calendar results; no new date parsing path.
  for (let n = 0; n < 60; n++) {
    const date = new Date(Date.UTC(2000, 0, 1 + n));
    const chart = calculateBasicBazi({ ...input, date: { year: 2000, month: date.getUTCMonth() + 1, day: date.getUTCDate() } });
    const stems = '甲乙丙丁戊己庚辛壬癸';
    const branches = '子丑寅卯辰巳午未申酉戌亥';
    const start = (branches.indexOf(chart.pillars.day.branch.value) - stems.indexOf(chart.pillars.day.stem.value) + 12) % 12;
    const expected = [branches[(start + 10) % 12], branches[(start + 11) % 12]];
    for (const branch of branches) {
      const sample = structuredClone(chart);
      sample.pillars.year.branch.value = branch;
      const matches = analyzeBasicBaziStructure(sample).shensha.pillars.year.matches;
      assert.equal(matches.some(m => m.id === 'kong_wang'), expected.includes(branch));
    }
  }
});
