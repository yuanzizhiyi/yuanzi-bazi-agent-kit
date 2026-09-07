import { mkdir, writeFile } from 'node:fs/promises';
import { calculateBasicBazi } from '../src/core.js';
import { renderBasicBaziPng } from '../src/image.js';

// Synthetic golden-case input, never a customer record. Public images omit all birth details.
const chart = calculateBasicBazi({
  calendar: { type: 'solar' },
  date: { year: 1988, month: 8, day: 9 },
  time: { hour: 2, minute: 53 },
  location: { timezone: 'Asia/Shanghai' },
  options: { timeCorrection: 'standard', dayBoundary: 'ziEarly' },
});
const destination = new URL('../docs/images/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const locale of ['zh-CN', 'zh-Hant', 'en'] as const) {
  await writeFile(new URL(`chart-example-${locale}.png`, destination), renderBasicBaziPng(chart, locale, { redactBirthDetails: true }));
}
