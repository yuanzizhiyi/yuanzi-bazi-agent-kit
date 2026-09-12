# Changelog

## 0.3.0 — Unreleased

- Recreate the editorial chart layout with a highlighted day column, complete table, directed five-element diagram and ten proportional bars.
- Bundle renamed Noto Sans CJK SC Regular and Noto Serif CJK SC SemiBold subsets; export 2160px-wide PNGs with dynamic height.
- Add the optional v1 `structure` extension: unweighted equal-occurrence shares and eight documented shensha / two co-occurrence rules with evidence.
- Advance core metadata to 0.2.0; retain calendar, time-zone, day-boundary, old raw counts and privacy contracts.
- Preserve redaction, unknown-time warnings and render compatibility with older v1 JSON.

## 0.2.1 — 2026-09-07

- Add MCP Registry ownership metadata and a server manifest with the required `mcp` argument.
- Preserve the 0.1.0 calculation engine and v1 JSON contract.


## 0.2.0 — 2026-09-07

- Return a locally rendered PNG alongside MCP JSON and readable chart facts.
- Add CLI `--image PATH.png` and Skill image presentation instructions.
- Bundle a renamed OFL font subset for consistent Chinese and English output.
- Preserve the v1 result schema and the 0.1.0 calculation engine.


All notable changes to this project are documented here. Package versions follow Semantic Versioning; the result schema is versioned separately.

## [0.1.0] - 2026-09-03

### Added

- Deterministic TypeScript core with the `yuanzi-basic-bazi/v1` result contract.
- Solar and lunar input, IANA time-zone validation, DST gap/overlap rejection, optional true solar time, and explicit day-boundary conventions.
- Nullable hour pillar, day master, ten gods, hidden stems, unweighted element counts, warnings, and method attribution.
- JSON/text CLI, local stdio MCP server, and the `yuanzi-basic-bazi` Agent Skill.
- Intent-specific hosted capability hook that never accepts chart or birth input.
- Golden tests, protocol integration tests, package checks, and automated coverage gates.
