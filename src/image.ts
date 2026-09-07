import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import type {
  BasicBaziLocale,
  BasicBaziResult,
  BasicBaziWarningCode,
  FiveElement,
} from './types.js';

const COLORS: Record<FiveElement, string> = {
  wood: '#34745c',
  fire: '#a52d37',
  earth: '#967141',
  metal: '#926e26',
  water: '#356582',
};
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!,
  );
const FONT = fileURLToPath(
  new URL('../assets/YuanziChartSans.otf', import.meta.url),
);
const LABELS = {
  'zh-CN': {
    title: '基础八字命盘',
    subtitle: '确定性排盘 · 本地生成',
    pillars: ['年柱', '月柱', '日柱', '时柱'],
    unknown: '未知',
    master: '日主',
    hidden: '藏干 · 十神',
    elements: '五行分布 · 未加权计数',
    visible: '天干地支',
    hiddenCount: '藏干',
    elementNames: ['木', '火', '土', '金', '水'],
    time: '排盘时间',
    civil: '当地民用时间',
    solar: '真太阳时',
    boundary: '换日',
    notice: '文化探索与参考，不代表强弱、喜忌或命运预测。',
    warnings: '计算提示',
  },
  'zh-Hant': {
    title: '基礎八字命盤',
    subtitle: '確定性排盤 · 本地生成',
    pillars: ['年柱', '月柱', '日柱', '時柱'],
    unknown: '未知',
    master: '日主',
    hidden: '藏干 · 十神',
    elements: '五行分布 · 未加權計數',
    visible: '天干地支',
    hiddenCount: '藏干',
    elementNames: ['木', '火', '土', '金', '水'],
    time: '排盤時間',
    civil: '當地民用時間',
    solar: '真太陽時',
    boundary: '換日',
    notice: '文化探索與參考，不代表強弱、喜忌或命運預測。',
    warnings: '計算提示',
  },
  en: {
    title: 'Your basic Bazi chart',
    subtitle: 'Deterministic facts. Rendered locally.',
    pillars: ['Year', 'Month', 'Day', 'Hour'],
    unknown: 'Unknown',
    master: 'Day master',
    hidden: 'Hidden stems / Ten Gods',
    elements: 'Five elements / unweighted counts',
    visible: 'Visible',
    hiddenCount: 'Hidden',
    elementNames: ['Wood', 'Fire', 'Earth', 'Metal', 'Water'],
    time: 'Chart time',
    civil: 'Civil time',
    solar: 'True solar time',
    boundary: 'Day boundary',
    notice:
      'For cultural exploration. Counts do not indicate strength or predict outcomes.',
    warnings: 'Calculation notes',
  },
};
const GODS: Record<string, string> = {
  比肩: 'Peer',
  劫财: 'Rob wealth',
  食神: 'Eating god',
  伤官: 'Hurting officer',
  偏财: 'Indirect wealth',
  正财: 'Direct wealth',
  七杀: 'Seven killings',
  正官: 'Direct officer',
  偏印: 'Indirect resource',
  正印: 'Direct resource',
  dayMaster: 'Day master',
};
const WARNINGS: Record<
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
const traditional = (s: string) =>
  s.replace(/财/g, '財').replace(/伤/g, '傷').replace(/杀/g, '殺');

export interface BasicBaziImageOptions {
  /** Hide date, birth clock, adjusted clock and timezone for public examples. */
  redactBirthDetails?: boolean;
}

/** A fixed layout from calculated facts; no external assets, URLs or arbitrary SVG input. */
export const renderBasicBaziSvg = (
  chart: BasicBaziResult,
  locale: BasicBaziLocale = 'zh-CN',
  options: BasicBaziImageOptions = {},
) => {
  const l = LABELS[locale];
  const height = 1160 + chart.warnings.length * 30;
  const chunks: string[] = [];
  const text = (
    value: string,
    x: number,
    y: number,
    size = 22,
    color = '#24251f',
    anchor = 'start',
  ) =>
    chunks.push(
      `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${escape(value)}</text>`,
    );
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke = 'none',
  ) =>
    chunks.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}"/>`,
    );
  const god = (s: string) =>
    locale === 'en'
      ? (GODS[s] ?? s)
      : s === 'dayMaster'
        ? l.master
        : locale === 'zh-Hant'
          ? traditional(s)
          : s;
  chunks.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}"><g font-family="Yuanzi Chart Sans">`,
  );
  rect(0, 0, 1080, height, '#fbf9f4');
  rect(30, 30, 1020, height - 60, '#fffaf2', '#d8c8b1');
  text(locale === 'en' ? 'Yuanzi Zhiyi' : '元梓知易', 64, 90, 30, '#9e0027');
  text('YUANZI ZHIYI', 1016, 88, 17, '#967141', 'end');
  chunks.push('<path d="M64 116H1016" stroke="#d8c8b1"/>');
  text(l.title, 64, 186, 44);
  text(l.subtitle, 64, 227, 20, '#75675b');
  if (options.redactBirthDetails) {
    const label =
      locale === 'en'
        ? 'Illustrative chart / birth details hidden'
        : locale === 'zh-Hant'
          ? '範例命盤 · 生辰資訊已隱藏'
          : '示例命盘 · 生辰信息已隐藏';
    text(label, 64, 270, 21, '#75675b');
    text('****-**-**  **:**', 64, 307, 20, '#75675b');
  } else {
    // Do not display an assumed noon or an assumed minute as a known birth time.
    const date = chart.calendar.solar.text.split(' ')[0];
    const recorded = chart.time.recorded;
    const clock = recorded.hourKnown
      ? `${String(recorded.hour).padStart(2, '0')}:${recorded.minuteKnown ? String(recorded.minute).padStart(2, '0') : '??'}`
      : l.unknown;
    text(
      `${date}  ${clock}  /  ${chart.time.timezone}`,
      64,
      270,
      21,
      '#75675b',
    );
    const corrected = recorded.hourKnown
      ? chart.time.adjusted.text
      : `${date} / ${l.unknown}`;
    text(
      `${l.time}${recorded.hourKnown && !recorded.minuteKnown ? ' *' : ''}: ${corrected}`,
      64,
      307,
      20,
      '#75675b',
    );
  }
  const pillars = Object.values(chart.pillars);
  pillars.forEach((p, i) => {
    const x = 64 + i * 244;
    rect(x, 347, 220, 388, i === 2 ? '#f5ede0' : '#fbf7ef', '#d8c8b1');
    text(l.pillars[i], x + 110, 390, 22, '#75675b', 'middle');
    text(
      p ? god(p.stem.tenGod) : l.unknown,
      x + 110,
      431,
      locale === 'en' ? 17 : 22,
      '#75675b',
      'middle',
    );
    text(
      p?.stem.value ?? '—',
      x + 110,
      509,
      64,
      p ? COLORS[p.stem.element] : '#75675b',
      'middle',
    );
    text(
      p?.branch.value ?? '—',
      x + 110,
      586,
      64,
      p ? COLORS[p.branch.element] : '#75675b',
      'middle',
    );
    chunks.push(`<path d="M${x + 20} 610H${x + 200}" stroke="#d8c8b1"/>`);
    p?.branch.hiddenStems.forEach((h, j) =>
      text(
        `${h.value}  ${god(h.tenGod)}`,
        x + 110,
        642 + j * 30,
        locale === 'en' ? 15 : 20,
        COLORS[h.element],
        'middle',
      ),
    );
  });
  text(l.hidden, 64, 769, 17, '#75675b');
  text(l.elements, 64, 826, 25);
  (Object.keys(COLORS) as FiveElement[]).forEach((el, i) => {
    const x = 64 + i * 194;
    rect(x, 854, 174, 100, '#f5ede0');
    text(l.elementNames[i], x + 18, 889, 24, COLORS[el]);
    text(
      `${l.visible} ${chart.fiveElements.visible[el]} / ${l.hiddenCount} ${chart.fiveElements.hiddenStems[el]}`,
      x + 18,
      927,
      locale === 'en' ? 15 : 17,
      '#75675b',
    );
  });
  text(
    `${chart.conventions.timeCorrection === 'trueSolar' ? l.solar : l.civil}  /  ${l.boundary}: ${chart.conventions.dayBoundary === 'ziEarly' ? '23:00' : '00:00'}`,
    64,
    1004,
    20,
  );
  chart.warnings.forEach((w, i) =>
    text(
      `${i === 0 ? l.warnings + ': ' : ''}${WARNINGS[locale][w.code]}`,
      64,
      1044 + i * 30,
      17,
      '#9e0027',
    ),
  );
  text(l.notice, 64, height - 70, locale === 'en' ? 18 : 20, '#75675b');
  text(
    `${chart.schemaVersion}  /  ${chart.coreVersion}`,
    64,
    height - 38,
    15,
    '#967141',
  );
  chunks.push('</g></svg>');
  return chunks.join('');
};

export const renderBasicBaziPng = (
  chart: BasicBaziResult,
  locale: BasicBaziLocale = 'zh-CN',
  options: BasicBaziImageOptions = {},
): Buffer =>
  new Resvg(renderBasicBaziSvg(chart, locale, options), {
    font: {
      fontFiles: [FONT],
      loadSystemFonts: false,
      defaultFontFamily: 'Yuanzi Chart Sans',
    },
  })
    .render()
    .asPng();
