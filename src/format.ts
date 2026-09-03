import type { BasicBaziLocale, BasicBaziResult } from './types.js';

const ELEMENT_LABELS = {
  'zh-CN': { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' },
  'zh-Hant': { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' },
  en: { wood: 'Wood', fire: 'Fire', earth: 'Earth', metal: 'Metal', water: 'Water' },
} as const;

export const formatBasicBaziText = (
  chart: BasicBaziResult,
  locale: BasicBaziLocale = 'zh-CN',
) => {
  const pillars = [
    chart.pillars.year.name,
    chart.pillars.month.name,
    chart.pillars.day.name,
    chart.pillars.hour?.name ?? (locale === 'en' ? 'unknown' : '未知'),
  ].join(' ');
  const element = ELEMENT_LABELS[locale][chart.dayMaster.element];
  const warningCodes = chart.warnings.map(({ code }) => code).join(', ');

  if (locale === 'en') {
    return [
      `Four pillars: ${pillars}`,
      `Day master: ${chart.dayMaster.value} (${element}, ${chart.dayMaster.yinYang})`,
      `Conventions: ${chart.conventions.timeCorrection}; ${chart.conventions.dayBoundary}`,
      warningCodes ? `Warnings: ${warningCodes}` : 'Warnings: none',
    ].join('\n');
  }

  const traditional = locale === 'zh-Hant';
  const yinYang = chart.dayMaster.yinYang === 'yang'
    ? (traditional ? '陽' : '阳')
    : (traditional ? '陰' : '阴');
  return [
    `四柱：${pillars}`,
    `日主：${chart.dayMaster.value}（${element}、${yinYang}）`,
    `${traditional ? '排盤口徑' : '排盘口径'}：${chart.conventions.timeCorrection} · ${chart.conventions.dayBoundary}`,
    warningCodes ? `提示：${warningCodes}` : `提示：${traditional ? '無' : '无'}`,
  ].join('\n');
};
