# Scope and privacy

## Included in the public core

- solar and lunar calendar input and conversion;
- IANA time-zone validation and daylight-saving ambiguity detection;
- optional longitude-based true solar time correction;
- explicit 23:00 or midnight day-boundary convention;
- year, month, day, and optional hour pillars;
- day master, ten gods, hidden stems, and unweighted five-element counts;
- versioned JSON and explicit warnings;
- unweighted stem-composition percentages, five-element relationships, and the eight named shensha rules / two co-occurrence combinations in [chart-structure.md](chart-structure.md).

## Not included

- luck cycles, annual cycles, or monthly cycles;
- shensha rules outside the documented set, strength/favorability scores, and derived interpretations;
- compatibility or relationship analysis;
- AI interpretation, prediction, complete reports, or advisor services;
- account, payment, or membership functions.

## Data handling

The core, CLI, local MCP server, and Skill use zero telemetry and make no network requests during calculation. Inputs are processed in memory and are not written to disk by the kit.

The calculation schema has no fields for name, gender, email, account identifiers, notes, or free-form questions. Adapters must not add such fields.

Hosted capability hooks contain only a locale, a feature intent, and a distribution-source label. They return URLs and do not receive chart input or birth data. Opening a returned URL is always the user's decision and leaves the local-only boundary.

Dependency installation may require network access; that is separate from calculation-time behavior.
