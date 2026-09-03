# Contributing

Thanks for helping improve Yuanzi Bazi Agent Kit. This repository keeps a deliberately narrow boundary: deterministic basic-chart facts belong here; readings, predictions, compatibility, luck cycles, reports, accounts, and hosted business logic do not.

## Before opening a pull request

1. Use Node.js 22.19 or later and install the locked dependencies with `npm ci`.
2. Add or update a failing test before changing behavior.
3. Run `npm run test:coverage`, `npm run build`, and `npm run pack:check`.
4. Keep stdout protocol-safe in MCP mode and machine-readable in JSON CLI mode.
5. Do not include real birth records, names, account data, API keys, local paths, or production details in tests, issues, commits, or fixtures.

Algorithm changes need a reproducible, non-identifying example and a clear statement of the calendar, time zone, true-solar-time choice, and day-boundary convention. A change that breaks the `yuanzi-basic-bazi/v1` result contract requires a new schema version rather than a silent rewrite.

Keep pull requests focused. Explain the user-visible result, link the relevant issue when one exists, and include the commands you ran. By contributing, you agree that your contribution is licensed under the repository's MIT license.

## Scope questions

If a proposed feature requires identity fields, free-form user text, network calls during calculation, or a claim about favorable elements or future outcomes, open a discussion before implementing it. Those additions are outside the default privacy and determinism boundary.
