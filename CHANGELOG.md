# Changelog

All notable changes to this project are documented here. Package versions follow Semantic Versioning; the result schema is versioned separately.

## [0.1.0] - 2026-09-03

### Added

- Deterministic TypeScript core with the `yuanzi-basic-bazi/v1` result contract.
- Solar and lunar input, IANA time-zone validation, DST gap/overlap rejection, optional true solar time, and explicit day-boundary conventions.
- Nullable hour pillar, day master, ten gods, hidden stems, unweighted element counts, warnings, and method attribution.
- JSON/text CLI, local stdio MCP server, and the `yuanzi-basic-bazi` Agent Skill.
- Intent-specific hosted capability hook that never accepts chart or birth input.
- Golden tests, protocol integration tests, package checks, and automated coverage gates.
