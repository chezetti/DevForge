# utils/ — pure transform logic

All tool business logic lives here: parsing, conversion, formatting, encoding. Functions are **pure** (no React, no DOM/store access) — which makes them testable and reusable across tools and the pipeline builder.

## Layout

- `parsers/json.ts` — beautify/minify/validate JSON, generate TS/Zod/Mongoose/SQL/CSV from JSON, deep-merge.
- `parsers/yaml.ts` — JSON↔YAML, `detectFormat`.
- `converters/toml.ts` — JSON↔TOML.
- `security.ts` — base64, URL-encode, JWT decode, hash/HMAC (Web Crypto), UUID/NanoID/ObjectId.
- `datetime.ts` — timestamps, relative time, date-diff, timezones, cron (`parseCron`, `getNextCronRuns`), formatting.
- `strings.ts` — case converters, slug, escape/unescape, regex test, `.env`↔JSON.
- `sql.ts` — formatSql, SQL→TypeORM, SQL→Prisma.
- `api.ts` — parseCurl, curl→fetch/axios, header parsing, query-string.
- `colors.ts` — parseColor + HEX/RGB/HSL/HSV/CMYK converters.

## Conventions

- Named exports; functions and their interfaces live together.
- Signatures use option defaults (`indent = 2`, `pretty = true`) rather than separate overloads where avoidable.
- Return structured results for status instead of throwing where that's part of the UX: e.g. `validateJson` → `{ valid, error, line, column }`. Throwing is acceptable for genuinely exceptional cases — the component catches it and surfaces `status: 'error'`.
- No React/`'use client'`, no `window`/`document` access in logic (Web Crypto in `security.ts` is fine — it's available on the server too).

## Tests

Tests live in `utils/__tests__/*.test.ts` (currently: `datetime`, `security`, `strings`). Vitest only picks up this pattern (`vitest.config.ts`), `node` environment, `@` alias.

```bash
pnpm test            # once
pnpm test:watch      # watch
```

When adding/changing a pure function, add or update a test and run `pnpm test` before committing.
