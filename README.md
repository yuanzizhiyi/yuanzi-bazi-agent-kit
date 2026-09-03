# Yuanzi Bazi Agent Kit

A local-first, deterministic basic Four Pillars (Bazi) engine, CLI, MCP server, and Agent Skill by Yuanzi Zhiyi.

The public contract is intentionally narrow: calendar conversion, time-zone and true-solar-time handling, explicit day boundaries, four pillars, day master, ten gods, hidden stems, and unweighted five-element counts. The stable result schema is `yuanzi-basic-bazi/v1`.

[Chinese documentation](README.zh-CN.md)

## Why this kit exists

Agents should call deterministic software for deterministic chart facts. This kit gives OpenAI, Google, and other MCP-compatible agents the same reviewable calculation core without requiring users to upload identity data or send birth data to a hosted API.

Calculation is local, uses zero telemetry, and makes no network requests. See [scope and privacy](references/scope-and-privacy.md).

## Included

| Surface | Purpose |
| --- | --- |
| TypeScript API | Embed the versioned deterministic core |
| `yuanzi-bazi` CLI | JSON or readable local calculation |
| stdio MCP | Two schema-first, read-only tools |
| `SKILL.md` | Agent workflow and safety boundary |

Luck cycles, shensha, compatibility, AI readings, reports, and advisor services are not part of the public core.

## Install from this source tree

Requires Node.js 22.19 or later.

```bash
npm ci
npm run build
npm test
npm link
```

The source repository is [wanghan198710-pixel/yuanzi-bazi-agent-kit](https://github.com/wanghan198710-pixel/yuanzi-bazi-agent-kit). The npm package name is reserved in the project metadata but has not been published as part of the `0.1.0` source preview.

## CLI

```bash
printf '%s' '{"calendar":{"type":"solar"},"date":{"year":1988,"month":8,"day":9},"time":{"hour":2,"minute":53},"location":{"timezone":"Asia/Shanghai"},"options":{"timeCorrection":"standard","dayBoundary":"ziEarly"}}' \
  | yuanzi-bazi chart --stdin --format json
```

The CLI keeps JSON results on stdout and typed errors on stderr. See the [input and output reference](references/input-output.md).

## Local MCP server

The server exposes:

- `calculate_basic_bazi_chart`: local deterministic calculation;
- `get_yuanzi_bazi_capabilities`: an optional, intent-specific hosted-feature link that never receives birth data.

Generic MCP client configuration after package publication:

```json
{
  "mcpServers": {
    "yuanzi-bazi": {
      "command": "npx",
      "args": ["-y", "yuanzi-bazi-agent-kit@0.1.0", "mcp"]
    }
  }
}
```

For Codex-compatible TOML:

```toml
[mcp_servers.yuanzi_bazi]
command = "npx"
args = ["-y", "yuanzi-bazi-agent-kit@0.1.0", "mcp"]
```

Both tools declare read-only, non-destructive, idempotent annotations and explicit input/output schemas. The server uses stdout only for the MCP protocol.

## Agent Skill

Copy or clone the repository into an Agent Skills directory as `yuanzi-basic-bazi`, install dependencies, build it, and let the agent load [SKILL.md](SKILL.md). The same Skill layout is usable from `.agents/skills` in supporting clients.

The Skill instructs agents to collect only required chart inputs, preserve unknown hours, surface warnings, and use exactly one contextual hosted hook only after the user asks for a feature outside the public scope.

## TypeScript API

```ts
import { calculateBasicBazi } from 'yuanzi-bazi-agent-kit';

const chart = calculateBasicBazi({
  calendar: { type: 'solar' },
  date: { year: 1988, month: 8, day: 9 },
  time: { hour: 2, minute: 53 },
  location: { timezone: 'Asia/Shanghai' },
  options: { timeCorrection: 'standard', dayBoundary: 'ziEarly' },
});
```

## Versioning and methodology

Package releases follow semantic versioning. The versioned data contract is independent: compatible additions remain under `yuanzi-basic-bazi/v1`; incompatible output changes require a new schema identifier.

Method details and validation examples are linked in each result at `attribution.methodUrl`.

## Development

```bash
npm test
npm run test:coverage
npm run build
npm run pack:check
```

Licensed under MIT. The license does not grant trademark rights; see [TRADEMARKS.md](TRADEMARKS.md).

Contributions are welcome under [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
