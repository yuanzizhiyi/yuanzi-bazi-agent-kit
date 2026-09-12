import { SixtyCycle } from 'tyme4ts';
import { EARTHLY_BRANCHES, HEAVENLY_STEMS, STEM_PROFILES, getTenGod } from './metadata.js';
import type {
  BasicBaziResult, BasicBaziStructure, BaziPillarKey, BaziShenshaColumn,
  BaziShenshaId, BaziShenshaMatch, FiveElement, TenGod,
} from './types.js';

export const PILLAR_KEYS = ['year', 'month', 'day', 'hour'] as const;
export const ELEMENT_ORDER: readonly FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];
export const TEN_GOD_ORDER: readonly TenGod[] = [
  '比肩', '劫财', '食神', '伤官', '正财', '偏财', '正官', '七杀', '正印', '偏印',
];
export const GENERATING_EDGES: ReadonlyArray<readonly [FiveElement, FiveElement]> = [
  ['wood', 'fire'], ['fire', 'earth'], ['earth', 'metal'], ['metal', 'water'], ['water', 'wood'],
];
export const CONTROLLING_EDGES: ReadonlyArray<readonly [FiveElement, FiveElement]> = [
  ['wood', 'earth'], ['earth', 'water'], ['water', 'fire'], ['fire', 'metal'], ['metal', 'wood'],
];

type ChartFacts = Pick<BasicBaziResult, 'pillars' | 'dayMaster'>;
// Tables and reference choices are versioned in references/chart-structure.md.
const TAI_JI: Record<string, string> = {
  甲: '子午', 乙: '子午', 丙: '卯酉', 丁: '卯酉', 戊: '辰戌丑未', 己: '辰戌丑未',
  庚: '寅亥', 辛: '寅亥', 壬: '巳申', 癸: '巳申',
};
const TIAN_YI: Record<string, string> = {
  甲: '丑未', 乙: '子申', 丙: '亥酉', 丁: '亥酉', 戊: '丑未', 己: '子申',
  庚: '丑未', 辛: '午寅', 壬: '巳卯', 癸: '巳卯',
};
const WEN_CHANG: Record<string, string> = {
  甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯',
};
const GROUPS = [
  { branches: '申子辰', canopy: '辰', lost: '亥' },
  { branches: '寅午戌', canopy: '戌', lost: '巳' },
  { branches: '巳酉丑', canopy: '丑', lost: '申' },
  { branches: '亥卯未', canopy: '未', lost: '寅' },
];
// Stem-combination convention: the four directional months have no stem target.
const TIAN_DE_HE: Record<string, string> = { 寅: '壬', 辰: '丁', 巳: '丙', 未: '己', 申: '戊', 戌: '辛', 亥: '庚', 丑: '乙' };
const NAMES: Record<BaziShenshaId, string> = {
  tai_ji: '太极贵人', hua_gai: '华盖', tian_de_he: '天德合', kong_wang: '空亡',
  wen_chang: '文昌贵人', tian_yi: '天乙贵人', wang_shen: '亡神', hong_luan: '红鸾',
};

const calculateShensha = (chart: ChartFacts): BasicBaziStructure['shensha'] => {
  const pillars = {} as Record<BaziPillarKey, BaziShenshaColumn>;
  const emptyBranches = SixtyCycle.fromName(chart.pillars.day.name).getExtraEarthBranches().map(b => b.getName());
  const yearBranchIndex = EARTHLY_BRANCHES.indexOf(chart.pillars.year.branch.value as typeof EARTHLY_BRANCHES[number]);
  const redMatch = EARTHLY_BRANCHES[(3 - yearBranchIndex + 12) % 12];
  for (const key of PILLAR_KEYS) {
    const column = chart.pillars[key];
    if (!column) {
      pillars[key] = { status: 'hour_unknown', matches: [], combinations: [] };
      continue;
    }
    const branch = column.branch.value;
    const matches: BaziShenshaMatch[] = [];
    const add = (id: BaziShenshaId, pillar: BaziPillarKey, part: 'stem' | 'branch' | 'pillar') => {
      const base = chart.pillars[pillar]!;
      const basis = { pillar, part, value: part === 'pillar' ? base.name : base[part].value };
      const existing = matches.find(m => m.id === id);
      if (existing) existing.basis.push(basis);
      else matches.push({ id, name: NAMES[id], basis: [basis] });
    };
    for (const base of ['year', 'day'] as const) {
      if (TAI_JI[chart.pillars[base].stem.value].includes(branch)) add('tai_ji', base, 'stem');
    }
    for (const base of ['year', 'day'] as const) {
      if (GROUPS.find(g => g.branches.includes(chart.pillars[base].branch.value))?.canopy === branch) add('hua_gai', base, 'branch');
    }
    if (TIAN_DE_HE[chart.pillars.month.branch.value] === column.stem.value) add('tian_de_he', 'month', 'branch');
    if (emptyBranches.includes(branch)) add('kong_wang', 'day', 'pillar');
    if (WEN_CHANG[chart.dayMaster.value] === branch) add('wen_chang', 'day', 'stem');
    if (TIAN_YI[chart.dayMaster.value].includes(branch)) add('tian_yi', 'day', 'stem');
    for (const base of ['year', 'day'] as const) {
      if (GROUPS.find(g => g.branches.includes(chart.pillars[base].branch.value))?.lost === branch) add('wang_shen', base, 'branch');
    }
    if (redMatch === branch) add('hong_luan', 'year', 'branch');
    const combinations: BaziShenshaColumn['combinations'] = [];
    if (matches.some(m => m.id === 'hua_gai')) {
      if (matches.some(m => m.id === 'kong_wang')) combinations.push({ id: 'canopy_empty', name: '华盖逢空', requires: ['hua_gai', 'kong_wang'] });
      if (matches.some(m => m.id === 'tai_ji')) combinations.push({ id: 'canopy_taiji', name: '华盖太极同宫', requires: ['hua_gai', 'tai_ji'] });
    }
    pillars[key] = { status: 'calculated', matches, combinations };
  }
  return { ruleSet: 'yuanzi-shensha/v1', pillars };
};

/** Largest remainder, in tenths of a percent, with stable Ten God order for ties. */
const percentages = (counts: number[], total: number): number[] => {
  const numerators = counts.map(count => count * 1000);
  const units = numerators.map(n => Math.floor(n / total));
  const remaining = 1000 - units.reduce((sum, n) => sum + n, 0);
  const order = counts.map((_, i) => i).sort((a, b) => (numerators[b] % total) - (numerators[a] % total) || a - b);
  for (const i of order.slice(0, remaining)) units[i]++;
  return units.map(n => n / 10);
};

/** Equal occurrences of visible stems (including the day master) and hidden stems.
 * Branches are represented by their hidden stems, never counted a second time.
 * This describes composition, not seasonal strength, favorability or predictions.
 */
export const analyzeBasicBaziStructure = (chart: ChartFacts): BasicBaziStructure => {
  const counts = TEN_GOD_ORDER.map(() => 0);
  for (const key of PILLAR_KEYS) {
    const pillar = chart.pillars[key];
    if (!pillar) continue;
    for (const stem of [pillar.stem, ...pillar.branch.hiddenStems]) counts[TEN_GOD_ORDER.indexOf(getTenGod(chart.dayMaster.value, stem.value))]++;
  }
  const total = counts.reduce((sum, n) => sum + n, 0);
  const percents = percentages(counts, total);
  const tenGods = TEN_GOD_ORDER.map((name, i) => ({
    name,
    element: STEM_PROFILES[HEAVENLY_STEMS.find(stem => getTenGod(chart.dayMaster.value, stem) === name)!].element,
    count: counts[i], percent: percents[i],
  }));
  const elements = ELEMENT_ORDER.map(element => {
    const pair = tenGods.filter(g => g.element === element);
    return {
      element, count: pair.reduce((sum, g) => sum + g.count, 0),
      percent: Math.round(pair.reduce((sum, g) => sum + g.percent, 0) * 10) / 10,
      tenGods: pair.map(g => g.name),
    };
  });
  return { method: 'equal-stem-occurrence/v1', total, elements, tenGods, shensha: calculateShensha(chart) };
};
