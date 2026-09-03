import type { FiveElement, TenGod, YinYang } from './types.js';

export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export const STEM_PROFILES: Record<string, { element: FiveElement; yinYang: YinYang }> = {
  甲: { element: 'wood', yinYang: 'yang' },
  乙: { element: 'wood', yinYang: 'yin' },
  丙: { element: 'fire', yinYang: 'yang' },
  丁: { element: 'fire', yinYang: 'yin' },
  戊: { element: 'earth', yinYang: 'yang' },
  己: { element: 'earth', yinYang: 'yin' },
  庚: { element: 'metal', yinYang: 'yang' },
  辛: { element: 'metal', yinYang: 'yin' },
  壬: { element: 'water', yinYang: 'yang' },
  癸: { element: 'water', yinYang: 'yin' },
};

export const BRANCH_PROFILES: Record<string, { element: FiveElement; yinYang: YinYang }> = {
  子: { element: 'water', yinYang: 'yang' },
  丑: { element: 'earth', yinYang: 'yin' },
  寅: { element: 'wood', yinYang: 'yang' },
  卯: { element: 'wood', yinYang: 'yin' },
  辰: { element: 'earth', yinYang: 'yang' },
  巳: { element: 'fire', yinYang: 'yin' },
  午: { element: 'fire', yinYang: 'yang' },
  未: { element: 'earth', yinYang: 'yin' },
  申: { element: 'metal', yinYang: 'yang' },
  酉: { element: 'metal', yinYang: 'yin' },
  戌: { element: 'earth', yinYang: 'yang' },
  亥: { element: 'water', yinYang: 'yin' },
};

export const HIDDEN_STEMS: Record<string, readonly string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '戊', '庚'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

const GENERATES: Record<FiveElement, FiveElement> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

const CONTROLS: Record<FiveElement, FiveElement> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

export const getTenGod = (dayStem: string, targetStem: string): TenGod => {
  const day = STEM_PROFILES[dayStem];
  const target = STEM_PROFILES[targetStem];
  if (!day || !target) throw new Error('Invalid heavenly stem');

  const samePolarity = day.yinYang === target.yinYang;
  if (day.element === target.element) return samePolarity ? '比肩' : '劫财';
  if (GENERATES[day.element] === target.element) return samePolarity ? '食神' : '伤官';
  if (CONTROLS[day.element] === target.element) return samePolarity ? '偏财' : '正财';
  if (CONTROLS[target.element] === day.element) return samePolarity ? '七杀' : '正官';
  return samePolarity ? '偏印' : '正印';
};
