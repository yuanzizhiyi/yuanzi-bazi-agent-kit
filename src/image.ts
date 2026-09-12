import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { analyzeBasicBaziStructure, CONTROLLING_EDGES, ELEMENT_ORDER, GENERATING_EDGES, PILLAR_KEYS } from './chart-structure.js';
import { COPY, ELEMENT_LABELS, localizeTerm, PILLAR_LABELS, ROW_LABELS, WARNINGS } from './image-copy.js';
import type { BasicBaziLocale, BasicBaziResult, FiveElement } from './types.js';

type Face = 'sans' | 'serif';
const METRICS = JSON.parse(readFileSync(new URL('../assets/chart-font-metrics.json', import.meta.url), 'utf8')) as Record<Face, Record<string, number>>;
const FONTS = ['YuanziChartSans.otf', 'YuanziChartSerif.otf'].map(name => fileURLToPath(new URL(`../assets/${name}`, import.meta.url)));
const BRAND_MARK = `data:image/png;base64,${readFileSync(new URL('../assets/yuanzi-logo-mark.png', import.meta.url)).toString('base64')}`;
const FAMILY: Record<Face, string> = { sans: 'Yuanzi Chart Sans', serif: 'Yuanzi Chart Serif' };
const COLORS: Record<FiveElement, string> = { wood: '#34745c', fire: '#8f271f', earth: '#967141', metal: '#806b48', water: '#356582' };
const PAPER = '#fbf7f0', INK = '#171713', MUTED = '#655a50', BORDER = '#d8cabc', GOLD = '#a17843', ACCENT = '#8f271f';
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
const number = (n: number) => String(Math.round(n * 100) / 100);
const width = (s: string, size: number, face: Face = 'sans') => Array.from(s).reduce((n, c) => n + (METRICS[face][c] ?? 1) * size, 0);
const wrap = (s: string, max: number, size: number, face: Face = 'sans'): string[] => {
  const lines: string[] = [];
  let line = '';
  for (const token of s.match(/[^\s\u2e80-\u9fff]+|\s+|[\u2e80-\u9fff]/gu) ?? []) {
    if (width(line + token, size, face) <= max) { line += token; continue; }
    if (line.trim()) lines.push(line.trim());
    line = '';
    if (width(token, size, face) <= max) { line = token.trimStart(); continue; }
    for (const c of token) {
      if (width(line + c, size, face) > max && line) { lines.push(line); line = ''; }
      line += c;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.length ? lines : [''];
};

type Chip = { x: number; y: number; w: number; h: number; lines: string[] };
const chips = (labels: string[], max: number, size: number) => {
  const result: Chip[] = [];
  let x = 0, y = 0, rowHeight = 0;
  for (const label of labels) {
    const lines = wrap(label, max - 20, size);
    const w = Math.min(max, Math.max(...lines.map(s => width(s, size))) + 20);
    const h = lines.length * (size + 5) + 10;
    if (x && x + w > max) { x = 0; y += rowHeight + 7; rowHeight = 0; }
    result.push({ x, y, w, h, lines });
    x += w + 7;
    rowHeight = Math.max(rowHeight, h);
  }
  return { items: result, height: y + rowHeight };
};

export interface BasicBaziImageOptions {
  /** Hide all birth dates, clocks and timezone for public examples. */
  redactBirthDetails?: boolean;
}

/** Fixed local vector layout. Fonts, text, arrows and proportions are deterministic. */
export const renderBasicBaziSvg = (chart: BasicBaziResult, locale: BasicBaziLocale = 'zh-CN', options: BasicBaziImageOptions = {}) => {
  const l = COPY[locale], english = locale === 'en';
  const structure = chart.structure ?? analyzeBasicBaziStructure(chart);
  const pillars = PILLAR_KEYS.map(key => chart.pillars[key]);
  const margin = 52, right = 1028, contentWidth = right - margin, labelWidth = 148, colWidth = (contentWidth - labelWidth) / 4;
  const colX = (i: number) => margin + labelWidth + i * colWidth;
  const colCenter = (i: number) => colX(i) + colWidth / 2;
  const term = (s: string) => localizeTerm(s, locale);
  const recorded = chart.time.recorded;
  const date = chart.calendar.solar.text.split(' ')[0];
  const clock = recorded.hourKnown ? `${String(recorded.hour).padStart(2, '0')}:${recorded.minuteKnown ? String(recorded.minute).padStart(2, '0') : '??'}` : l.unknown;
  const adjusted = !recorded.hourKnown ? l.unknown : recorded.minuteKnown ? chart.time.adjusted.text : `${chart.time.adjusted.text.slice(0, 13)}:??`;
  const metadata = options.redactBirthDetails
    ? [l.hidden]
    : [
      `${l.recorded}  ${date} ${clock}  /  ${chart.time.timezone}`,
      `${l.adjusted}  ${adjusted}`,
      ...(english ? [] : [`${l.calendar}  ${term(chart.calendar.lunar.text)}`]),
    ];
  const metadataLines = metadata.flatMap(s => wrap(s, contentWidth, 16));
  const tableTitleY = 250 + metadataLines.length * 25 + 45;
  const tableY = tableTitleY + 29;
  const chipFont = english ? 13 : 16;
  const shensha = PILLAR_KEYS.map(key => structure.shensha.pillars[key]);
  const starChips = shensha.map(p => chips(p.matches.map(m => term(m.name)), colWidth - 30, chipFont));
  const comboChips = shensha.map(p => chips(p.combinations.map(m => term(m.name)), colWidth - 30, chipFont));
  const heights = [62, 80, 51, 80, 54, english ? 77 : 54, Math.max(86, ...starChips.map(c => c.height + 30)), Math.max(82, ...comboChips.map(c => c.height + 30))];
  const rowY = heights.map((_, i) => tableY + heights.slice(0, i).reduce((a, b) => a + b, 0));
  const tableHeight = heights.reduce((a, b) => a + b, 0);
  const tableBottom = tableY + tableHeight;
  const analysisY = tableBottom + 86;
  const notesY = analysisY + 558;
  const statsLines = wrap(l.statsDetail, contentWidth, 15);
  const warningLines = chart.warnings.map(w => ({ code: w.code, lines: wrap(WARNINGS[locale][w.code], contentWidth - 28, 16) }));
  const warningsHeight = warningLines.length ? 34 + warningLines.reduce((n, w) => n + w.lines.length * 24 + 10, 0) : 0;
  const notesHeight = 38 + statsLines.length * 24;
  const height = notesY + notesHeight + warningsHeight + 120;
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="${number(height * 2)}" viewBox="0 0 1080 ${number(height)}" role="img" aria-label="${escape(l.title)}">`,
    `<title>${escape(l.title)}</title>`,
    '<defs><marker id="generate-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#a17843"/></marker><marker id="control-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#737e82"/></marker></defs>',
    `<rect width="1080" height="${number(height)}" fill="${PAPER}"/>`,
  ];
  const text = (value: string, x: number, y: number, size = 18, color = INK, anchor = 'start', face: Face = 'sans') => out.push(`<text x="${number(x)}" y="${number(y)}" font-family="${FAMILY[face]}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${escape(value)}</text>`);
  const rect = (x: number, y: number, w: number, h: number, fill: string, stroke = 'none', radius = 0, extra = '') => out.push(`<rect ${extra} x="${number(x)}" y="${number(y)}" width="${number(w)}" height="${number(h)}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`);
  const line = (x1: number, y1: number, x2: number, y2: number, color = BORDER) => out.push(`<path d="M${number(x1)} ${number(y1)}L${number(x2)} ${number(y2)}" fill="none" stroke="${color}"/>`);
  const linesAt = (lines: string[], x: number, y: number, size: number, color = INK, anchor = 'start', leading = size + 7) => lines.forEach((s, i) => text(s, x, y + i * leading, size, color, anchor));
  const cell = (value: string, i: number, row: number, size = 18, color = INK, face: Face = 'sans') => {
    const lines = wrap(value, colWidth - 26, size, face);
    const start = rowY[row] + heights[row] / 2 - ((lines.length - 1) * (size + 5)) / 2 + size * 0.36;
    lines.forEach((s, n) => text(s, colCenter(i), start + n * (size + 5), size, color, 'middle', face));
  };
  const section = (num: string, title: string, x: number, y: number, end: number) => {
    text(num + ' /', x, y, 37, GOLD, 'start', 'serif');
    text(title, x + 81, y, english ? 28 : 30, INK, 'start', 'serif');
    const start = x + 81 + width(title, english ? 28 : 30, 'serif') + 20;
    if (start < end - 10) line(start, y - 10, end, y - 10, GOLD);
  };

  // Keep the site's complete mark + wordmark lockup, using the original local PNG.
  out.push(`<image data-role="brand-mark" x="52" y="23" width="62" height="62" href="${BRAND_MARK}"/>`);
  text(l.brand, margin + 78, 58, english ? 27 : 29, INK, 'start', 'serif');
  out.push(`<text x="130" y="81" font-family="${FAMILY.sans}" font-size="10" letter-spacing="4.2" fill="${GOLD}">YUANZI ZHIYI</text>`);
  text(l.title, margin - 3, 173, english ? 72 : 77, INK, 'start', 'serif');
  text(pillars.map(p => p?.name ?? l.unknown).join(' · '), margin, 222, english ? 30 : 32, INK, 'start', 'serif');
  const masterGlyph = chart.dayMaster.value + ELEMENT_LABELS['zh-CN'][ELEMENT_ORDER.indexOf(chart.dayMaster.element)];
  text(masterGlyph, right - 6, 171, 72, ACCENT, 'end', 'serif');
  text(english ? `${l.dayMaster} / ${ELEMENT_LABELS.en[ELEMENT_ORDER.indexOf(chart.dayMaster.element)]}` : l.dayMaster, right - 8, 206, 17, ACCENT, 'end');
  line(margin, 242, right, 242, GOLD);
  linesAt(metadataLines, margin, 270, 16, MUTED, 'start', 25);
  if (options.redactBirthDetails) text('****-**-**  **:**', right, 270, 14, MUTED, 'end');
  section('01', l.table, margin, tableTitleY, right);

  rect(margin, tableY, contentWidth, tableHeight, 'none', BORDER, 5);
  rect(colX(2), tableY, colWidth, tableHeight, '#f7e8e3', 'none', 0, 'data-role="day-column"');
  rect(colX(1), tableY, colWidth, heights[0], '#f3ebdf');
  line(colX(1), tableY, colX(2), tableY, GOLD);
  line(colX(2), tableY, colX(3), tableY, ACCENT);
  for (let i = 0; i < 4; i++) line(colX(i), tableY, colX(i), tableBottom);
  rowY.slice(1).forEach(y => line(margin, y, right, y));
  ROW_LABELS[locale].forEach((label, i) => {
    const size = english ? 15 : 20, labels = wrap(label, labelWidth - 32, size);
    linesAt(labels, margin + 18, rowY[i + 1] + heights[i + 1] / 2 - (labels.length - 1) * (size + 7) / 2 + size * 0.36, size, MUTED);
  });
  pillars.forEach((p, i) => {
    text(PILLAR_LABELS[locale][i], colCenter(i), tableY + (i === 1 || i === 2 ? 27 : 39), 23, INK, 'middle', 'serif');
    if (i === 1 || i === 2) text(i === 1 ? `${l.month}${english ? '' : ' · ' + chart.pillars.month.branch.value}` : l.dayMaster, colCenter(i), tableY + 49, 12, i === 2 ? ACCENT : GOLD, 'middle');
    cell(p?.stem.value ?? '—', i, 1, 57, p ? COLORS[p.stem.element] : MUTED, 'serif');
    cell(p ? term(p.stem.tenGod) : l.unknown, i, 2, english ? 16 : 23);
    cell(p?.branch.value ?? '—', i, 3, 57, p ? COLORS[p.branch.element] : MUTED, 'serif');
    cell(p ? p.branch.hiddenStems.map(h => h.value).join(' / ') : '—', i, 4, 22);
    if (p && english) linesAt(p.branch.hiddenStems.map(h => `${h.value} / ${term(h.tenGod)}`), colCenter(i), rowY[5] + 22, 13, MUTED, 'middle', 22);
    else cell(p ? p.branch.hiddenStems.map(h => term(h.tenGod)).join(' / ') : '—', i, 5, 16);
    for (const [row, packed] of [[6, starChips[i]], [7, comboChips[i]]] as const) {
      if (!packed.items.length) {
        cell(shensha[i].status === 'hour_unknown' ? l.notCalculated : l.none, i, row, english ? 14 : 20, MUTED);
        continue;
      }
      const top = rowY[row] + (heights[row] - packed.height) / 2;
      for (const chip of packed.items) {
        const x = colX(i) + 15 + chip.x, y = top + chip.y;
        rect(x, y, chip.w, chip.h, PAPER, BORDER, 13);
        linesAt(chip.lines, x + chip.w / 2, y + chipFont + 3, chipFont, MUTED, 'middle', chipFont + 5);
      }
    }
  });
  text(l.rules, margin, tableBottom + 30, english ? 14 : 15, MUTED);
  section('02', l.elements, margin, analysisY, 538);
  section('03', l.gods, 619, analysisY, right);
  line(582, analysisY - 30, 582, analysisY + 525);

  const cx = 287, cy = analysisY + 265, radius = 158, nodeRadius = 47;
  const first = ELEMENT_ORDER.indexOf(chart.dayMaster.element);
  const cycle = ELEMENT_ORDER.map((_, i) => ELEMENT_ORDER[(first + i) % 5]);
  const positions = Object.fromEntries(cycle.map((el, i) => {
    const angle = (-90 + i * 72) * Math.PI / 180;
    return [el, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), angle }];
  })) as Record<FiveElement, { x: number; y: number; angle: number }>;
  for (const [from, to] of CONTROLLING_EDGES) {
    const a = positions[from], b = positions[to];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const dx = (b.x - a.x) / distance, dy = (b.y - a.y) / distance;
    out.push(`<path data-edge="control:${from}:${to}" d="M${number(a.x + dx * (nodeRadius + 5))} ${number(a.y + dy * (nodeRadius + 5))}L${number(b.x - dx * (nodeRadius + 7))} ${number(b.y - dy * (nodeRadius + 7))}" stroke="#737e82" stroke-width="1.4" fill="none" marker-end="url(#control-arrow)"/>`);
  }
  for (const [from, to] of GENERATING_EDGES) {
    const trim = 0.35, start = positions[from].angle + trim, end = positions[from].angle + 2 * Math.PI / 5 - trim;
    out.push(`<path data-edge="generate:${from}:${to}" d="M${number(cx + radius * Math.cos(start))} ${number(cy + radius * Math.sin(start))}A${radius} ${radius} 0 0 1 ${number(cx + radius * Math.cos(end))} ${number(cy + radius * Math.sin(end))}" stroke="${GOLD}" stroke-width="1.5" stroke-dasharray="5 5" fill="none" marker-end="url(#generate-arrow)"/>`);
  }
  for (const entry of structure.elements) {
    const p = positions[entry.element], color = COLORS[entry.element], master = entry.element === chart.dayMaster.element;
    out.push(`<circle cx="${number(p.x)}" cy="${number(p.y)}" r="${nodeRadius}" fill="${PAPER}" stroke="${color}" stroke-width="1.8"/>`);
    text(ELEMENT_LABELS['zh-CN'][ELEMENT_ORDER.indexOf(entry.element)], p.x, p.y + (english ? -3 : 2), english ? 35 : 39, color, 'middle', 'serif');
    if (english) text(ELEMENT_LABELS.en[ELEMENT_ORDER.indexOf(entry.element)], p.x, p.y + 15, 12, color, 'middle');
    text(`${entry.percent}%`, p.x, p.y + (english ? 34 : 27), 17, color, 'middle');
    if (master) {
      const w = english ? 81 : 44;
      rect(p.x - w / 2, p.y + 39, w, 23, ACCENT, 'none', 3);
      text(l.dayMaster, p.x, p.y + 55, english ? 11 : 13, '#fffaf5', 'middle');
    }
    const groups = entry.tenGods.map(term);
    const groupLines = english ? groups : [groups.join(' / ')];
    const groupY = master ? p.y - (english ? 76 : 63) : p.y + 73;
    const groupSize = english ? 12 : 14;
    const groupWidth = Math.max(...groupLines.map(s => width(s, groupSize)));
    rect(p.x - groupWidth / 2 - 3, groupY - groupSize, groupWidth + 6, groupLines.length * 17 + 2, PAPER);
    linesAt(groupLines, p.x, groupY, groupSize, color, 'middle', 17);
  }
  out.push(`<path d="M138 ${analysisY + 514}h48" fill="none" stroke="${GOLD}" stroke-width="1.5" stroke-dasharray="5 5" marker-end="url(#generate-arrow)"/>`);
  text(l.generating, 198, analysisY + 519, 15, MUTED);
  out.push(`<path d="M338 ${analysisY + 514}h48" fill="none" stroke="#737e82" stroke-width="1.4" marker-end="url(#control-arrow)"/>`);
  text(l.controlling, 398, analysisY + 519, 15, MUTED);

  const barX = 765, barWidth = 191;
  const maximum = Math.max(50, Math.ceil(Math.max(...structure.tenGods.map(g => g.percent)) / 25) * 25);
  structure.tenGods.forEach((god, i) => {
    const y = analysisY + 57 + i * 40;
    text(term(god.name), 619, y + 5, english ? 15 : 21, COLORS[god.element]);
    rect(barX, y - 12, barWidth, 14, '#eae4dc', 'none', 6);
    rect(barX, y - 12, barWidth * god.percent / maximum, 14, COLORS[god.element], 'none', 6, `data-bar="${escape(god.name)}"`);
    text(`${god.percent}%`, right, y + 5, 19, INK, 'end');
  });
  const axisY = analysisY + 461;
  line(barX, axisY, barX + barWidth, axisY, GOLD);
  for (const fraction of [0, 0.5, 1]) {
    const x = barX + fraction * barWidth;
    line(x, axisY, x, axisY + 5, GOLD);
    text(`${maximum * fraction}${fraction === 1 ? '%' : ''}`, x, axisY + 25, 14, MUTED, 'middle');
  }

  line(margin, notesY - 21, right, notesY - 21);
  text(l.stats, margin, notesY + 5, 18, INK);
  text(`${l.total}  ${structure.total}`, right, notesY + 5, 16, MUTED, 'end');
  linesAt(statsLines, margin, notesY + 33, 15, MUTED, 'start', 24);
  let warningY = notesY + notesHeight + 18;
  if (warningLines.length) {
    text(l.warning, margin, warningY, 19, ACCENT);
    warningY += 30;
    for (const warning of warningLines) {
      out.push(`<g data-warning="${warning.code}">`);
      linesAt(warning.lines, margin + 14, warningY, 16, ACCENT, 'start', 24);
      out.push('</g>');
      warningY += warning.lines.length * 24 + 10;
    }
  }
  const mode = chart.conventions.timeCorrection === 'trueSolar' ? recorded.hourKnown ? l.solar : l.skippedSolar : l.standard;
  text(`${mode}  /  ${l.boundary} ${chart.conventions.dayBoundary === 'ziEarly' ? '23:00' : '00:00'}`, margin, height - 89, 15, MUTED);
  text(l.notice, right, height - 89, 14, MUTED, 'end');
  line(margin, height - 68, right, height - 68, GOLD);
  text(l.footer, margin, height - 38, english ? 14 : 16, INK);
  text(`${chart.schemaVersion} / ${chart.coreVersion}`, right, height - 38, 12, MUTED, 'end');
  out.push('</svg>');
  return out.join('');
};

export const renderBasicBaziPng = (chart: BasicBaziResult, locale: BasicBaziLocale = 'zh-CN', options: BasicBaziImageOptions = {}): Buffer => new Resvg(renderBasicBaziSvg(chart, locale, options), {
  font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: FAMILY.sans },
}).render().asPng();
