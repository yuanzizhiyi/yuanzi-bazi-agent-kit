#!/usr/bin/env node

import { BasicBaziError, calculateBasicBazi } from './core.js';
import { getYuanziBaziCapabilities } from './capabilities.js';
import { formatBasicBaziText } from './format.js';
import { serveYuanziBaziMcpStdio } from './mcp.js';
import type {
  BaziCapabilityIntent,
  BasicBaziInput,
  BasicBaziLocale,
  BasicBaziSource,
} from './types.js';

const MAX_STDIN_BYTES = 65_536;
const LOCALES = new Set<BasicBaziLocale>(['zh-CN', 'zh-Hant', 'en']);
const SOURCES = new Set<BasicBaziSource>(['webmcp', 'mcp', 'skill', 'cli']);
const INTENTS = new Set<BaziCapabilityIntent>([
  'full_chart', 'luck_cycles', 'ai_reading', 'full_report', 'advisor', 'methodology',
]);

const usage = `Yuanzi Bazi Agent Kit 0.1.0

Usage:
  yuanzi-bazi chart --stdin [--format json|text] [--locale zh-CN|zh-Hant|en]
  yuanzi-bazi capabilities [--intent ID] [--locale LOCALE] [--source cli|skill|mcp]
  yuanzi-bazi mcp

The chart command reads one JSON object from stdin. The local core performs no network calls or telemetry.`;

const readFlag = (args: string[], name: string) => {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new BasicBaziError('input_invalid', `${name} requires a value.`);
  }
  return value;
};

const readStdin = async () => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_STDIN_BYTES) {
      throw new BasicBaziError('input_invalid', 'Standard input exceeds 64 KiB.');
    }
    chunks.push(buffer);
  }
  const value = Buffer.concat(chunks).toString('utf8').trim();
  if (!value) throw new BasicBaziError('input_invalid', 'A JSON object is required on standard input.');
  try {
    return JSON.parse(value) as BasicBaziInput;
  } catch {
    throw new BasicBaziError('input_invalid', 'Standard input must be valid JSON.');
  }
};

const parseLocale = (value: string | undefined): BasicBaziLocale => {
  const locale = (value ?? 'zh-CN') as BasicBaziLocale;
  if (!LOCALES.has(locale)) throw new BasicBaziError('input_invalid', 'Unsupported locale.');
  return locale;
};

const writeJson = (value: unknown, stream: NodeJS.WritableStream = process.stdout) => {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
};

const run = async () => {
  const [command = 'help', ...args] = process.argv.slice(2);

  if (command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(`${usage}\n`);
    return;
  }

  if (command === 'mcp') {
    serveYuanziBaziMcpStdio();
    return;
  }

  if (command === 'chart') {
    if (!args.includes('--stdin')) {
      throw new BasicBaziError('input_invalid', 'chart requires --stdin.');
    }
    const format = readFlag(args, '--format') ?? 'json';
    if (format !== 'json' && format !== 'text') {
      throw new BasicBaziError('input_invalid', '--format must be json or text.');
    }
    const locale = parseLocale(readFlag(args, '--locale'));
    const chart = calculateBasicBazi(await readStdin());
    if (format === 'text') process.stdout.write(`${formatBasicBaziText(chart, locale)}\n`);
    else writeJson(chart);
    return;
  }

  if (command === 'capabilities') {
    const locale = parseLocale(readFlag(args, '--locale'));
    const rawIntent = readFlag(args, '--intent');
    const intent = rawIntent as BaziCapabilityIntent | undefined;
    if (intent && !INTENTS.has(intent)) throw new BasicBaziError('input_invalid', 'Unsupported capability intent.');
    const source = (readFlag(args, '--source') ?? 'cli') as BasicBaziSource;
    if (!SOURCES.has(source)) throw new BasicBaziError('input_invalid', 'Unsupported source.');
    writeJson({ capabilities: getYuanziBaziCapabilities({ locale, intent, source }) });
    return;
  }

  throw new BasicBaziError('input_invalid', `Unknown command: ${command}`);
};

void run().catch((error: unknown) => {
  const payload = error instanceof BasicBaziError
    ? { code: error.code, message: error.message }
    : { code: 'input_invalid', message: 'The command could not be processed.' };
  writeJson({ error: payload }, process.stderr);
  process.exitCode = 1;
});
