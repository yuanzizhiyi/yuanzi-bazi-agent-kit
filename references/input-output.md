# Input and output reference

## Input

Send one JSON object to `yuanzi-bazi chart --stdin` or to the MCP tool `calculate_basic_bazi_chart`:

```json
{
  "calendar": { "type": "solar", "isLeapMonth": false },
  "date": { "year": 1988, "month": 8, "day": 9 },
  "time": { "hour": 2, "minute": 53 },
  "location": { "timezone": "Asia/Shanghai", "longitude": 121.4737 },
  "options": { "timeCorrection": "standard", "dayBoundary": "ziEarly" }
}
```

For an unknown birth hour, set both `hour` and `minute` to `null`. For a known hour with an unknown minute, set only `minute` to `null`; the engine uses minute `0` and emits a warning.

`timezone` must be an IANA identifier. `longitude` is degrees east in the range `-180` to `180` and is required only for `trueSolar` correction.

The two day-boundary values are:

- `ziEarly`: the next sexagenary day begins at 23:00;
- `midnight`: the next sexagenary day begins at 00:00.

## Output

The stable top-level schema identifier is `yuanzi-basic-bazi/v1`. Output contains:

- `engine` and `conventions` for reproducibility;
- `calendar.solar` and `calendar.lunar` conversion results;
- `time.recorded`, `time.adjusted`, `time.termReference`, and an optional correction breakdown;
- typed `pillars.year`, `month`, `day`, and nullable `hour`;
- `dayMaster`;
- visible stems/branches and hidden-stem ten-god metadata;
- `fiveElements.visible` and `fiveElements.hiddenStems`, both unweighted counts;
- machine-readable `warnings`;
- project attribution and methodology URL.

The MCP tool wraps the chart as:

```json
{
  "chart": { "schemaVersion": "yuanzi-basic-bazi/v1" }
}
```

It does not append a promotional URL to a calculation. Only call `get_yuanzi_bazi_capabilities` after the user explicitly asks for a hosted feature outside the public scope; its required `intent` returns exactly one matching link.

## Typed errors

Expected error codes include `input_invalid`, `calendar_invalid`, `date_invalid`, `time_invalid`, `timezone_invalid`, `dst_gap`, `dst_overlap`, `longitude_invalid`, and `longitude_required`.

Daylight-saving gaps and overlaps fail closed. Ask the user to supply a different unambiguous local time; do not silently select an offset.

## Images

The stdio MCP calculation returns JSON in `structuredContent.chart` and a JSON text block, readable facts, and a base64 `image/png` content block. Client image support determines inline display. CLI `--image PATH.png` saves a PNG without changing JSON stdout; it requires a new file path and writes a save notice to stderr. The Node-only `yuanzi-bazi-agent-kit/image` export provides `renderBasicBaziPng(chart, locale, { redactBirthDetails: true })` for public examples. Redaction removes the birth date, recorded and adjusted clock, and time zone from image content; chart facts remain visible. PNG rendering uses no site API or AI generation.
