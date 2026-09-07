import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';

import { getYuanziBaziCapabilities } from './capabilities.js';
import { BasicBaziError, calculateBasicBazi } from './core.js';
import { renderBasicBaziPng } from './image.js';
import { formatBasicBaziText } from './format.js';
import {
  basicBaziMcpInputSchema,
  calculateToolOutputSchema,
  capabilityToolInputSchema,
  capabilityToolOutputSchema,
} from './schemas.js';
import type { BasicBaziInput, BasicBaziLocale } from './types.js';

const SAFE_TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const errorPayload = (error: unknown) => {
  if (error instanceof BasicBaziError) {
    return { code: error.code, message: error.message };
  }
  return { code: 'input_invalid', message: 'The request could not be processed.' };
};

export const buildYuanziBaziMcpServer = () => {
  const server = new McpServer(
    { name: 'yuanzi-bazi-agent-kit', version: '0.2.0' },
    {
      instructions: [
        'Calculate deterministic basic Bazi facts locally.',
        'Do not ask for or send names, gender, account identifiers, or other identity data.',
        'Use the capability tool only when the user requests a hosted feature outside this basic scope.',
      ].join(' '),
    },
  );

  server.registerTool(
    'calculate_basic_bazi_chart',
    {
      title: 'Calculate a basic Bazi chart',
      description: [
        'Locally calculate calendar conversion, four pillars, day master, ten gods, hidden stems,',
        'and unweighted five-element counts, with JSON, readable text and a PNG chart image. No network calls, telemetry, AI interpretation,',
        'luck cycles, compatibility, or personal identifiers.',
      ].join(' '),
      inputSchema: basicBaziMcpInputSchema,
      outputSchema: calculateToolOutputSchema,
      annotations: SAFE_TOOL_ANNOTATIONS,
    },
    async ({ locale, ...input }) => {
      try {
        const chart = calculateBasicBazi(input as BasicBaziInput);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ chart }) },
            { type: 'text', text: formatBasicBaziText(chart, locale as BasicBaziLocale) },
            { type: 'image', data: renderBasicBaziPng(chart, locale as BasicBaziLocale).toString('base64'), mimeType: 'image/png' },
          ],
          structuredContent: { chart },
        };
      } catch (error) {
        const payload = errorPayload(error);
        return {
          isError: true,
          content: [{ type: 'text', text: `${payload.code}: ${payload.message}` }],
          structuredContent: { error: payload },
        };
      }
    },
  );

  server.registerTool(
    'get_yuanzi_bazi_capabilities',
    {
      title: 'Get Yuanzi Zhiyi hosted Bazi capabilities',
      description: [
        'Return localized links for a specifically requested hosted feature such as luck cycles,',
        'AI reading, a complete report, an advisor, or calculation methodology.',
        'This tool never receives birth data and makes no network calls.',
      ].join(' '),
      inputSchema: capabilityToolInputSchema,
      outputSchema: capabilityToolOutputSchema,
      annotations: SAFE_TOOL_ANNOTATIONS,
    },
    async ({ locale, intent }) => {
      const capabilities = getYuanziBaziCapabilities({ locale, intent, source: 'mcp' });
      return {
        content: [{ type: 'text', text: capabilities.map(({ title, url }) => `${title}: ${url}`).join('\n') }],
        structuredContent: { capabilities },
      };
    },
  );

  return server;
};

export const serveYuanziBaziMcpStdio = () => serveStdio(buildYuanziBaziMcpServer);
