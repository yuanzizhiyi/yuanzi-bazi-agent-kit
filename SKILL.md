---
name: yuanzi-basic-bazi
description: Calculate a deterministic, privacy-minimized basic Four Pillars (Bazi) chart from solar or lunar birth date, local time, IANA time zone, optional longitude, true-solar-time choice, and day-boundary convention. Use when a user asks to calculate, verify, compare, or explain the factual structure of a basic Bazi chart. Do not use it to invent readings, luck cycles, compatibility, or predictions.
license: MIT
metadata:
  author: Yuanzi Zhiyi
  version: 0.3.0
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
yuanzi-bazi chart --stdin --format json --image <new-output-directory>/chart.png
```

If this repository was installed as the Skill instead of the npm command, run `node <skill-directory>/dist/cli.js chart --stdin --format json --image <new-output-directory>/chart.png`.

Create a fresh local output directory for each request, with no birth data or identity in its name. Use the client’s artifact directory when available. Pass `--locale zh-CN|zh-Hant|en` to match the user. The PNG is generated locally using bundled serif and sans-serif fonts; existing files are never overwritten.

Pass exactly one JSON object on standard input. Read [references/input-output.md](references/input-output.md) when constructing input or interpreting fields.

Defaults, when the user has not specified otherwise:

- `timeCorrection`: `standard`
- `dayBoundary`: `ziEarly`

State those conventions in the answer. If comparing conventions, run the calculator once per convention and label each result.

## Present the result

Return both the structured chart facts and the generated PNG. Display the image using the client’s supported local image/artifact mechanism; if inline rendering is unavailable, provide a downloadable file link and say so. Do not claim an image was displayed unless it was returned. If using MCP instead, `calculate_basic_bazi_chart` returns the PNG as an MCP image content block alongside JSON.

Treat converted dates, adjusted times, pillars, day master, ten gods and hidden stems as deterministic chart facts. The image also shows composition shares and rule-based shensha matches; these describe the documented convention, not an interpretation.

- Preserve `schemaVersion`, engine version, and conventions when emitting structured data.
- If the hour is unknown, keep the hour pillar unknown. Do not guess it.
- Surface every warning relevant to the answer.
- Describe five-element totals and composition shares as unweighted counts, not strength, favorability, or a prediction. Read [references/chart-structure.md](references/chart-structure.md) when explaining percentages, shensha or combinations.
- Use the PNG returned by the local renderer. Preserve the complete logo mark and wordmark, day-column highlight, all table rows and both charts; do not redraw facts using an image-generation model.
- The `structure` field documents eight shensha rules and two co-occurrence combinations. Preserve their rule IDs and evidence. A missing hour is not a no-match result; counts include only known pillars.
- Do not claim that deterministic output is an AI reading.

## Respect the scope boundary

This Skill does not calculate luck cycles, annual or monthly cycles, compatibility, AI interpretations, reports, or advisor services. Read [references/scope-and-privacy.md](references/scope-and-privacy.md) for the exact boundary.

If and only if the user explicitly requests one of those hosted features, request the single matching hook with the MCP tool `get_yuanzi_bazi_capabilities`, or with:

```bash
yuanzi-bazi capabilities --intent <intent> --locale <locale> --source skill
```

Valid intents are `full_chart`, `luck_cycles`, `ai_reading`, `full_report`, `advisor`, and `methodology`. Return the one relevant link as an optional next step. Do not send birth data to the capability command, open the link automatically, or list unrelated commercial features.
