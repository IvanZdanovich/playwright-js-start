# Parallel execution

Use this page to run the suite faster, locally or in CI. Parallelism is native to Playwright: no custom runner,
no display server, no output buffering.

## How the suite splits

- **Spec files run in parallel**, one file per worker at a time.
- **Tests inside one file run in order** in one worker. Every spec declares `test.describe.configure({ mode: 'serial' })`,
  because each When builds on the state the previous one left. `fullyParallel: false` in `playwright.config.js`
  keeps it that way.
- **Projects split by test type**: `integration-api`, `integration-ui`, `e2e-ui`. Each has its own `testMatch`.

The largest spec file sets the lower bound of a run, so a very long spec is a candidate for splitting by page state.

## Local runs

```bash
npm test                              # Playwright picks the worker count (half the CPU cores)
PARALLEL_STREAMS=4 npm test           # fixed worker count
npm run test:parallel                 # PARALLEL_STREAMS workers, default 3
npm run test:api                      # one project
npx playwright test --project=e2e-ui  # any project
```

## CI sharding

A shard is one CI machine running a slice of the spec files. The weekly workflow runs a matrix of shards, each with
`--shard=<index>/<total>` and the `blob` reporter, then merges the blobs into one HTML and one JSON report:

```bash
npx playwright test --shard=1/2 --reporter=blob
npx playwright merge-reports --reporter=html,json ./all-blob-reports
```

The merged JSON at `reports/results.json` feeds the flaky ledger and the sign-off report, so they see one run, not one
per shard.

## Choosing a count

- **Workers** — about one per CPU core for API specs; UI specs each start a browser, so use fewer on small machines.
- **Shards** — add a shard when one machine is saturated. Each shard pays the browser install and `npm ci` again.
- **Too many workers** — show up as timeouts, not as speed. Lower `PARALLEL_STREAMS` first.

## Source of truth

The serial-mode and shared-page rules live in `.claude/rules/ui-specs.md`, `.claude/rules/api-specs.md`, and
`.claude/rules/e2e-specs.md`. This page explains how to run them.
