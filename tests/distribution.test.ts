import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Skill metadata names the skill and teaches privacy-safe local use', async () => {
  const [skill, openai] = await Promise.all([read('SKILL.md'), read('agents/openai.yaml')]);

  assert.match(skill, /^---\nname: yuanzi-basic-bazi\n/m);
  assert.match(skill, /description:/);
  assert.match(skill, /yuanzi-bazi chart --stdin/);
  assert.match(skill, /Do not ask for.*name.*gender/is);
  assert.match(skill, /get_yuanzi_bazi_capabilities/);
  assert.match(openai, /default_prompt:.*\$yuanzi-basic-bazi/);
});

test('distribution documents local-only scope, versioning, and hosted feature boundary', async () => {
  const [readme, chinese, privacy, inputOutput, trademark, license] = await Promise.all([
    read('README.md'),
    read('README.zh-CN.md'),
    read('references/scope-and-privacy.md'),
    read('references/input-output.md'),
    read('TRADEMARKS.md'),
    read('LICENSE'),
  ]);

  for (const document of [readme, chinese]) {
    assert.match(document, /yuanzi-basic-bazi\/v1/);
    assert.match(document, /calculate_basic_bazi_chart/);
    assert.match(document, /get_yuanzi_bazi_capabilities/);
  }
  assert.match(privacy, /zero telemetry/i);
  assert.match(privacy, /name.*gender/is);
  assert.match(inputOutput, /explicitly asks for a hosted feature/i);
  assert.doesNotMatch(inputOutput, /"nextActions"/);
  assert.match(trademark, /does not grant.*trademark/is);
  assert.match(license, /MIT License/);
});

test('public distribution contains no private machine or production paths', async () => {
  const documents = await Promise.all([
    read('README.md'),
    read('README.zh-CN.md'),
    read('SKILL.md'),
    read('references/input-output.md'),
    read('references/scope-and-privacy.md'),
  ]);
  const combined = documents.join('\n');

  assert.doesNotMatch(
    combined,
    /\/home\/[a-z0-9._-]+\/|\/Users\/[a-z0-9._-]+\/|(?:10|127)\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|\.env\.local|ssh[-_](?:host|target)/i,
  );
});

test('repository metadata is ready for public collaboration and automated verification', async () => {
  const [
    packageText,
    contributing,
    security,
    changelog,
    notices,
    workflow,
    bugTemplate,
  ] = await Promise.all([
    read('package.json'),
    read('CONTRIBUTING.md'),
    read('SECURITY.md'),
    read('CHANGELOG.md'),
    read('THIRD_PARTY_NOTICES.md'),
    read('.github/workflows/ci.yml'),
    read('.github/ISSUE_TEMPLATE/bug_report.yml'),
  ]);
  const packageJson = JSON.parse(packageText) as {
    repository?: { url?: string };
    homepage?: string;
    bugs?: { url?: string };
    publishConfig?: { access?: string };
    scripts?: Record<string, string>;
  };

  assert.equal(packageJson.repository?.url, 'git+https://github.com/wanghan198710-pixel/yuanzi-bazi-agent-kit.git');
  assert.equal(packageJson.homepage, 'https://github.com/wanghan198710-pixel/yuanzi-bazi-agent-kit#readme');
  assert.equal(packageJson.bugs?.url, 'https://github.com/wanghan198710-pixel/yuanzi-bazi-agent-kit/issues');
  assert.equal(packageJson.publishConfig?.access, 'public');
  assert.match(packageJson.scripts?.prepublishOnly || '', /test:coverage/);
  assert.match(contributing, /pull request/i);
  assert.match(security, /Security Advisories/i);
  assert.match(changelog, /0\.1\.0/);
  assert.match(notices, /tyme4ts/);
  assert.match(notices, /Copyright \(c\) 2024 6tail/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run test:coverage/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(bugTemplate, /privacy/i);
});
