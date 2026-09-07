import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const runCli = async (args: string[], stdin = '') => new Promise<{
  code: number | null;
  stdout: string;
  stderr: string;
}>((resolve, reject) => {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/cli.ts', ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
  child.once('error', reject);
  child.once('close', (code) => resolve({ code, stdout, stderr }));
  child.stdin.end(stdin);
});

const basicInput = {
  calendar: { type: 'solar' },
  date: { year: 1988, month: 8, day: 9 },
  time: { hour: 2, minute: 53 },
  location: { timezone: 'Asia/Shanghai' },
  options: { timeCorrection: 'standard', dayBoundary: 'ziEarly' },
};

test('CLI calculates a chart from stdin and keeps stdout machine-readable', async () => {
  const result = await runCli(['chart', '--stdin', '--format', 'json'], JSON.stringify(basicInput));

  assert.equal(result.code, 0);
  assert.equal(result.stderr, '');
  const output = JSON.parse(result.stdout);
  assert.equal(output.schemaVersion, 'yuanzi-basic-bazi/v1');
  assert.deepEqual(
    [output.pillars.year.name, output.pillars.month.name, output.pillars.day.name, output.pillars.hour.name],
    ['戊辰', '庚申', '丙申', '己丑'],
  );
});

test('CLI exposes localized hosted capability hooks without contacting the site', async () => {
  const result = await runCli([
    'capabilities',
    '--locale', 'en',
    '--intent', 'ai_reading',
    '--source', 'skill',
  ]);

  assert.equal(result.code, 0);
  assert.equal(result.stderr, '');
  const output = JSON.parse(result.stdout);
  assert.equal(output.capabilities.length, 1);
  assert.equal(output.capabilities[0].id, 'ai_reading');
  assert.match(output.capabilities[0].url, /utm_source=skill/);
});

test('CLI reports typed validation failures on stderr and never prints a stack', async () => {
  const invalid = { ...basicInput, location: { timezone: 'Invalid/Timezone' } };
  const result = await runCli(['chart', '--stdin'], JSON.stringify(invalid));

  assert.equal(result.code, 1);
  assert.equal(result.stdout, '');
  const output = JSON.parse(result.stderr);
  assert.equal(output.error.code, 'timezone_invalid');
  assert.equal('stack' in output.error, false);
});

test('CLI renders help and localized text output', async () => {
  const [help, english, traditional] = await Promise.all([
    runCli(['--help']),
    runCli(['chart', '--stdin', '--format', 'text', '--locale', 'en'], JSON.stringify(basicInput)),
    runCli(['chart', '--stdin', '--format', 'text', '--locale', 'zh-Hant'], JSON.stringify(basicInput)),
  ]);

  assert.equal(help.code, 0);
  assert.match(help.stdout, /Usage:/);
  assert.match(english.stdout, /Four pillars:/);
  assert.match(traditional.stdout, /排盤口徑/);
});

test('CLI rejects malformed flags, commands, and standard input', async () => {
  const oversized = JSON.stringify({ value: 'x'.repeat(66_000) });
  const cases = await Promise.all([
    runCli(['chart']),
    runCli(['chart', '--stdin', '--format', 'yaml'], JSON.stringify(basicInput)),
    runCli(['chart', '--stdin', '--locale', 'fr'], JSON.stringify(basicInput)),
    runCli(['chart', '--stdin', '--format']),
    runCli(['chart', '--stdin'], ''),
    runCli(['chart', '--stdin'], '{bad json'),
    runCli(['chart', '--stdin'], oversized),
    runCli(['capabilities', '--intent', 'prediction']),
    runCli(['capabilities', '--source', 'unknown']),
    runCli(['unknown']),
  ]);

  for (const result of cases) {
    assert.equal(result.code, 1);
    assert.equal(result.stdout, '');
    assert.equal(JSON.parse(result.stderr).error.code, 'input_invalid');
  }
  assert.match(JSON.parse(cases[6].stderr).error.message, /64 KiB/);
});

test('CLI lists all hosted capabilities with defaults', async () => {
  const result = await runCli(['capabilities']);
  assert.equal(result.code, 0);
  assert.equal(JSON.parse(result.stdout).capabilities.length, 6);
});


test('CLI saves a private PNG alongside unchanged JSON and refuses to overwrite it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yuanzi-image-test-'));
  try {
    const filename = join(directory, 'chart.png');
    const input = JSON.stringify(basicInput);
    const plain = await runCli(['chart', '--stdin'], input);
    const result = await runCli(['chart', '--stdin', '--image', filename], input);
    assert.equal(result.code, 0);
    assert.equal(result.stdout, plain.stdout);
    assert.match(result.stderr, /Image saved:/);
    const png = await readFile(filename);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    if (process.platform !== 'win32') assert.equal((await stat(filename)).mode & 0o777, 0o600);
    const duplicate = await runCli(['chart', '--stdin', '--image', filename], input);
    assert.equal(duplicate.code, 1);
    assert.equal(duplicate.stdout, '');
    assert.match(JSON.parse(duplicate.stderr).error.message, /new PNG path/);
    assert.deepEqual(await readFile(filename), png);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
