import type { BasicBaziLocale, BasicBaziWarningCode } from './types.js';

export const traditional = (value: string) => {
  const pairs = ['盘盤', '详詳', '时時', '图圖', '极極', '贵貴', '盖蓋', '鸾鸞', '红紅', '组組', '无無', '计計', '权權', '数數', '财財', '伤傷', '杀殺', '阴陰', '阳陽', '发發', '录錄', '历曆', '换換', '隐隱', '显顯', '钟鐘', '标標', '准準', '构構', '为為', '应應', '仅僅', '复複', '总總', '则則', '项項', '见見', '与與', '义義', '据據', '语語', '说說', '强強', '运運', '测測', '统統', '纳納', '态態', '农農', '现現', '览覽', '参參', '规規', '闰閏', '腊臘'];
  pairs.push('结結', '预預');
  return Array.from(value, c => pairs.find(p => p[0] === c)?.[1] ?? c).join('');
};

const CN = {
  title: '四柱命盘', table: '四柱详表', elements: '五行分布', gods: '十神占比',
  brand: '元梓知易', dayMaster: '日主', month: '月令', unknown: '未知',
  notCalculated: '未计算', none: '无', hidden: '示例命盘 · 生辰信息已隐藏',
  recorded: '钟表时间', adjusted: '排盘时间', timezone: '时区', calendar: '农历',
  standard: '标准时间', solar: '真太阳时', skippedSolar: '真太阳时未校正', boundary: '换日',
  generating: '相生', controlling: '相克', relation: '相生与相克', composition: '十神构成',
  stats: '天干与藏干等权统计 · 未加权计数',
  statsDetail: '含日主；地支以藏干计入，不重复计数。占比不代表旺衰或喜忌。',
  rules: '神煞按固定规则匹配；组合仅表示同柱共现。',
  warning: '计算提示', total: '统计项数', notice: '文化探索与参考，不代表命运预测。',
  footer: '元梓知易 · 四柱结构一览',
};
export const COPY: Record<BasicBaziLocale, typeof CN> = {
  'zh-CN': CN,
  'zh-Hant': Object.fromEntries(Object.entries(CN).map(([k, v]) => [k, traditional(v)])) as typeof CN,
  en: {
    title: 'Four Pillars', table: 'Pillar details', elements: 'Five elements', gods: 'Ten Gods',
    brand: 'Yuanzi Zhiyi', dayMaster: 'Day master', month: 'Month branch', unknown: 'Unknown',
    notCalculated: 'Not calculated', none: 'None', hidden: 'Example chart / birth details hidden',
    recorded: 'Civil time', adjusted: 'Chart time', timezone: 'Time zone', calendar: 'Lunar date',
    standard: 'Standard time', solar: 'True solar time', skippedSolar: 'Solar correction skipped', boundary: 'Day boundary',
    generating: 'Generating', controlling: 'Controlling', relation: 'Element relationships', composition: 'Composition',
    stats: 'Visible + hidden stems / unweighted counts',
    statsDetail: 'Includes the day master. Branches count only via hidden stems. Shares do not indicate strength or favorability.',
    rules: 'Shensha use fixed rules; combinations describe same-pillar co-occurrence only.',
    warning: 'Calculation notes', total: 'Stem occurrences', notice: 'For cultural exploration. Not a prediction.',
    footer: 'Yuanzi Zhiyi / Four Pillars at a glance',
  },
};
export const ROW_LABELS = {
  'zh-CN': ['天干', '天干十神', '地支', '地支藏干', '藏干十神', '神煞', '神煞组合'],
  'zh-Hant': ['天干', '天干十神', '地支', '地支藏干', '藏干十神', '神煞', '神煞組合'],
  en: ['Heavenly stem', 'Stem Ten God', 'Earthly branch', 'Hidden stems', 'Hidden Ten Gods', 'Shensha', 'Combinations'],
};
export const PILLAR_LABELS = { 'zh-CN': ['年柱', '月柱', '日柱', '时柱'], 'zh-Hant': ['年柱', '月柱', '日柱', '時柱'], en: ['Year', 'Month', 'Day', 'Hour'] };
export const ELEMENT_LABELS = { 'zh-CN': ['木', '火', '土', '金', '水'], 'zh-Hant': ['木', '火', '土', '金', '水'], en: ['Wood', 'Fire', 'Earth', 'Metal', 'Water'] };
const ENGLISH: Record<string, string> = {
  比肩: 'Peer', 劫财: 'Rob wealth', 食神: 'Eating god', 伤官: 'Hurting officer',
  正财: 'Direct wealth', 偏财: 'Indirect wealth', 正官: 'Direct officer', 七杀: 'Seven killings',
  正印: 'Direct resource', 偏印: 'Indirect resource', dayMaster: 'Day master',
  太极贵人: 'Taiji noble', 华盖: 'Canopy', 天德合: 'Heavenly virtue union', 空亡: 'Xun empty',
  文昌贵人: 'Literary star', 天乙贵人: 'Tianyi noble', 亡神: 'Lost spirit', 红鸾: 'Red phoenix',
  华盖逢空: 'Canopy + empty', 华盖太极同宫: 'Canopy + Taiji',
};
export const localizeTerm = (text: string, locale: BasicBaziLocale) => locale === 'en'
  ? ENGLISH[text] ?? text
  : text === 'dayMaster' ? '日主' : locale === 'zh-Hant' ? traditional(text) : text;

export const WARNINGS: Record<
  BasicBaziLocale,
  Record<BasicBaziWarningCode, string>
> = {
  'zh-CN': {
    hour_unknown: '时辰未知，时柱留空。',
    late_zi_day_uncertain: '出生时刻未知，子初换日附近的日柱有待核对。',
    solar_term_time_uncertain: '出生时刻未知，交节附近的年柱与月柱有待核对。',
    minute_unknown_assumed_zero: '分钟未知，暂按 00 分计算，并非确切出生分钟。',
    boundary_proximity_uncertain: '分钟未知，临近换日、换时辰或交节时需复核。',
    true_solar_skipped_hour_unknown: '时辰未知，未进行真太阳时校正。',
    true_solar_boundary_changed: '真太阳时校正跨越了时辰或日期边界。',
  },
  'zh-Hant': {
    hour_unknown: '時辰未知，時柱留空。',
    late_zi_day_uncertain: '出生時刻未知，子初換日附近的日柱有待核對。',
    solar_term_time_uncertain: '出生時刻未知，交節附近的年柱與月柱有待核對。',
    minute_unknown_assumed_zero: '分鐘未知，暫按 00 分計算，並非確切出生分鐘。',
    boundary_proximity_uncertain: '分鐘未知，臨近換日、換時辰或交節時需複核。',
    true_solar_skipped_hour_unknown: '時辰未知，未進行真太陽時校正。',
    true_solar_boundary_changed: '真太陽時校正跨越了時辰或日期邊界。',
  },
  en: {
    hour_unknown: 'Birth hour unknown; the hour pillar is omitted.',
    late_zi_day_uncertain:
      'Unknown time: verify the day pillar near the Zi-hour boundary.',
    solar_term_time_uncertain:
      'Unknown time: verify year/month pillars near solar-term boundaries.',
    minute_unknown_assumed_zero:
      'Minute unknown; calculation assumes 00, not a confirmed birth minute.',
    boundary_proximity_uncertain:
      'Unknown minute: verify results near hour/day or solar-term boundaries.',
    true_solar_skipped_hour_unknown:
      'True solar correction skipped because the birth hour is unknown.',
    true_solar_boundary_changed:
      'True solar correction crossed an hour or date boundary.',
  },
};
