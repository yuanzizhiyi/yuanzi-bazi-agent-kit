import assert from 'node:assert/strict';
import test from 'node:test';

import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const childEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
);

const withClient = async (run: (client: Client, stderr: () => string) => Promise<void>) => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--import', 'tsx', 'src/cli.ts', 'mcp'],
    cwd: process.cwd(),
    env: childEnv,
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', (chunk: Buffer | string) => { stderr += chunk.toString(); });
  const client = new Client(
    { name: 'yuanzi-bazi-agent-kit-test', version: '0.1.0' },
    { versionNegotiation: { mode: 'auto' } },
  );
  try {
    await client.connect(transport);
    await run(client, () => stderr);
  } finally {
    await client.close();
  }
};

const basicInput = {
  calendar: { type: 'solar' },
  date: { year: 1988, month: 8, day: 9 },
  time: { hour: 2, minute: 53 },
  location: { timezone: 'Asia/Shanghai' },
  options: { timeCorrection: 'standard', dayBoundary: 'ziEarly' },
  locale: 'zh-CN',
};

test('stdio MCP advertises two safe read-only tools with explicit schemas', async () => {
  await withClient(async (client, stderr) => {
    const { tools } = await client.listTools();

    assert.deepEqual(tools.map(({ name }) => name), [
      'calculate_basic_bazi_chart',
      'get_yuanzi_bazi_capabilities',
    ]);
    for (const tool of tools) {
      assert.equal(tool.annotations?.readOnlyHint, true);
      assert.equal(tool.annotations?.destructiveHint, false);
      assert.equal(tool.annotations?.idempotentHint, true);
      assert.equal(tool.inputSchema.type, 'object');
      assert.ok(tool.outputSchema);
    }
    const capabilityTool = tools.find(({ name }) => name === 'get_yuanzi_bazi_capabilities');
    assert.deepEqual(capabilityTool?.inputSchema.required, ['intent']);
    assert.equal('source' in (capabilityTool?.inputSchema.properties || {}), false);
    assert.equal(stderr(), '');
  });
});

test('stdio MCP returns only structured basic chart output until a hosted feature is requested', async () => {
  await withClient(async (client, stderr) => {
    await client.listTools();
    const result = await client.callTool({
      name: 'calculate_basic_bazi_chart',
      arguments: basicInput,
    });

    assert.notEqual(result.isError, true);
    assert.ok(result.structuredContent && typeof result.structuredContent === 'object');
    const structured = result.structuredContent as Record<string, any>;
    assert.equal(structured.chart.schemaVersion, 'yuanzi-basic-bazi/v1');
    assert.equal(structured.chart.pillars.day.name, '丙申');
    assert.deepEqual(Object.keys(structured), ['chart']);
    const image = result.content.find(item => item.type === 'image');
    assert.ok(image && image.type === 'image');
    assert.equal(image.mimeType, 'image/png');
    assert.equal(Buffer.from(image.data, 'base64').subarray(0,8).toString('hex'), '89504e470d0a1a0a');
    assert.match(String(result.content[1] && 'text' in result.content[1] ? result.content[1].text : ''), /四柱/);
    assert.equal(stderr(), '');
  });
});

test('stdio MCP turns invalid chart input into a typed tool error', async () => {
  await withClient(async (client) => {
    await client.listTools();
    const result = await client.callTool({
      name: 'calculate_basic_bazi_chart',
      arguments: { ...basicInput, location: { timezone: 'Invalid/Timezone' } },
    });

    assert.equal(result.isError, true);
    assert.ok(result.structuredContent && typeof result.structuredContent === 'object');
    assert.equal((result.structuredContent as Record<string, any>).error.code, 'timezone_invalid');
  });
});

test('stdio MCP exposes only the requested hosted capability', async () => {
  await withClient(async (client) => {
    await client.listTools();
    const result = await client.callTool({
      name: 'get_yuanzi_bazi_capabilities',
      arguments: { locale: 'en', intent: 'full_report' },
    });

    assert.notEqual(result.isError, true);
    const structured = result.structuredContent as Record<string, any>;
    assert.equal(structured.capabilities.length, 1);
    assert.equal(structured.capabilities[0].id, 'full_report');
    assert.match(structured.capabilities[0].url, /\/en\/price\?tab=report/);
  });
});
