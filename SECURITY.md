# Security Policy

## Supported versions

The latest `0.1.x` release receives security fixes while this project is in public preview.

## Reporting a vulnerability

Please use this repository's private [GitHub Security Advisories](https://github.com/yuanzizhiyi/yuanzi-bazi-agent-kit/security/advisories/new) form. Do not disclose a suspected vulnerability in a public issue, and do not attach real birth data, credentials, tokens, or account records.

Include the affected version, a minimal synthetic reproduction, the expected impact, and any mitigation you have already tested. We will acknowledge a report when it is reviewed and coordinate disclosure after a fix is available.

The public calculator is intended to run locally with zero telemetry and no network requests. A regression that transmits calculation input, accepts identity fields, leaks input through logs, or mixes protocol output with diagnostics should be treated as a security and privacy issue.
