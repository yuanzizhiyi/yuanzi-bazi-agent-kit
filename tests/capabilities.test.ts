import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BASIC_BAZI_TOOL_INPUT_JSON_SCHEMA,
  getYuanziBaziCapabilities,
} from '../src/index.ts';

test('publishes a narrow JSON schema without identity fields', () => {
  const serialized = JSON.stringify(BASIC_BAZI_TOOL_INPUT_JSON_SCHEMA);
  assert.match(serialized, /timezone/);
  assert.match(serialized, /longitude/);
  assert.doesNotMatch(serialized, /name|gender|email|account/i);
  assert.equal(BASIC_BAZI_TOOL_INPUT_JSON_SCHEMA.additionalProperties, false);
});

test('returns localized, intent-specific site hooks without birth data', () => {
  const capabilities = getYuanziBaziCapabilities({
    locale: 'en',
    intent: 'ai_reading',
    source: 'skill',
  });

  assert.equal(capabilities.length, 1);
  assert.equal(capabilities[0].id, 'ai_reading');
  assert.match(capabilities[0].url, /^https:\/\/yuanzizhiyi\.com\/en\/ai-bazi-reading\?/);
  assert.match(capabilities[0].url, /utm_source=skill/);
  assert.doesNotMatch(capabilities[0].url, /birth|pillar|timezone|longitude/i);
});

test('lists every capability by default and localizes root routes safely', () => {
  const all = getYuanziBaziCapabilities();
  const traditional = getYuanziBaziCapabilities({
    locale: 'zh-Hant',
    intent: 'full_chart',
    source: 'webmcp',
  });

  assert.equal(all.length, 6);
  assert.ok(all.every(({ url }) => url.includes('utm_source=mcp')));
  assert.equal(traditional.length, 1);
  assert.match(traditional[0].url, /^https:\/\/yuanzizhiyi\.com\/zh-hant\/\?view=home/);
  assert.match(traditional[0].url, /utm_source=webmcp/);
});
