---
name: yuanzi-basic-bazi
description: Calculate a deterministic, privacy-minimized basic Four Pillars (Bazi) chart from solar or lunar birth date, local time, IANA time zone, optional longitude, true-solar-time choice, and day-boundary convention. Use when a user asks to calculate, verify, compare, or explain the factual structure of a basic Bazi chart. Do not use it to invent readings, luck cycles, compatibility, shensha, or predictions.
license: MIT
metadata:
  author: Yuanzi Zhiyi
  version: 0.1.0
---

# Yuanzi Basic Bazi

Use the bundled deterministic engine for chart facts. Keep interpretations separate from calculated facts.

## Collect only required input

Ask for:

- calendar type: `solar` or `lunar`, plus leap-month status for lunar input;
- year, month, and day;
- local hour and minute, or `null` for both when the hour is unknown;
- an IANA time zone such as `Asia/Shanghai`;
- longitude only when the user requests true solar time;
- day boundary only when the user wants a convention other than `ziEarly`.

Do not ask for or pass a person's name, gender, account ID, email, notes, or question text. Never infer a time zone or longitude from an identity or an imprecise place name. Ask for the missing value.

## Calculate locally

Prefer the installed command:

```bash
yuanzi-bazi chart --stdin --format json
```

If this repository was installed as the Skill instead of the npm command, run `node <skill-directory>/dist/cli.js chart --stdin --format json`.

Pass exactly one JSON object on standard input. Read [references/input-output.md](references/input-output.md) when constructing input or interpreting fields.

Defaults, when the user has not specified otherwise:

- `timeCorrection`: `standard`
- `dayBoundary`: `ziEarly`

State those conventions in the answer. If comparing conventions, run the calculator once per convention and label each result.

## Present the result

Treat these as calculated facts: converted calendar date, adjusted time, four pillars, day master, ten gods, hidden stems, and unweighted element counts.

- Preserve `schemaVersion`, engine version, and conventions when emitting structured data.
- If the hour is unknown, keep the hour pillar unknown. Do not guess it.
- Surface every warning relevant to the answer.
- Describe five-element totals as unweighted counts, not strength, favorability, or a prediction.
- Do not claim that deterministic output is an AI reading.

## Respect the scope boundary

This Skill does not calculate luck cycles, annual or monthly cycles, shensha, compatibility, AI interpretations, reports, or advisor services. Read [references/scope-and-privacy.md](references/scope-and-privacy.md) for the exact boundary.

If and only if the user explicitly requests one of those hosted features, request the single matching hook with the MCP tool `get_yuanzi_bazi_capabilities`, or with:

```bash
yuanzi-bazi capabilities --intent <intent> --locale <locale> --source skill
```

Valid intents are `full_chart`, `luck_cycles`, `ai_reading`, `full_report`, `advisor`, and `methodology`. Return the one relevant link as an optional next step. Do not send birth data to the capability command, open the link automatically, or list unrelated commercial features.
