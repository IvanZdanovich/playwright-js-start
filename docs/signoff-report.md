# Sign-off report

Script: `scripts/generate-signoff-report.js` (template: `scripts/report-template/`)

Turns executable requirements and the latest Playwright results into a branded manual-testing checklist. The output is
`reports/signoff-report.html` (self-contained: CSS, logo and screenshots are inlined). The report is HTML only. A PDF is produced on demand from the browser with the report's **Print / Save PDF** button.
The report is optional; in CI it is only built when the `generate_signoff_report` input is enabled.

## How it works

1. **Static parse** — every `playwright/**/*.spec.js` is parsed with espree, using the same block classification as
   the lint rules and [coverage gap analysis](coverage-gap-analysis.md). Each `test.describe` and `test` contributes its
   title path, its `.skip` / `.fixme` state (inherited by children; a `test` without a body counts as skipped) and its
   `req({ ... })` argument (inline, or a `const` bound to a `req()` call).
2. **Runtime results** — the Playwright JSON report at `reports/results.json` (override with `--reports`, a file or a
   folder of JSON reports). In CI this is the report merged from all shards.
3. **Join** — static checks and runtime tests are matched on spec file + `test.describe` titles + test title. A runtime
   `passed` / `failed` / `skipped` state wins. A test with no result (a serial spec stopped by an earlier failure, or
   a failed hook) is shown as `Not Executed`, with the reason on hover. Template-literal titles (`${...}`) match the runtime
   title they evaluate to; a runtime test that matches no static check, or more than one, is listed on its own.
   A check's `refs`, `bugs` and `preconditions` are combined with those of its enclosing blocks; other `req` fields of
   an inner block override the outer ones. A `test.describe` block's own `req()` is shown on its heading.
4. **Scope** — when reports exist, only the executed spec files are included; with no reports every spec is listed as
   a blank checklist.
5. **Metadata** — branch, commit and build come from the CI variables used by `collect-test-results.js` (Azure DevOps,
   GitHub Actions, ...). `TARGET_ENV` and `BROWSER` fill the environment and platform.

## Report sections

- **Summary** — application, repository, branch, commit SHA, build, environment, platform, execution date/time. All times are shown as
  `YYYY-MM-DD HH:mm:ss UTC`.
- **Coverage Overview** — specs, checks, passed / failed / skipped / not executed, automation coverage (passed ÷ all
  checks) and manual validation (everything not passed ÷ all checks).
- **Prioritised Spec List** — failed specs first, then by checks needing manual validation (descending), then by
  priority `P1 > P2 > P3`. A spec's priority is the highest `req.p` on any of its blocks; omitted `p` is `P2`. The
  Refs / Bugs column lists the spec's `req()` refs and bugs (bugs in red); URLs show their last segment (the Jira
  key) and link to the full URL.
- **Failed Tests Detail** — file, title path, error message, stack trace, screenshot(s), environment / browser,
  `req()` refs and bugs (merged from enclosing blocks) and timestamp. Screenshots are the PNG attachments Playwright
  records on the failed test (`screenshot: 'only-on-failure'`), inlined from `test-results/`.
- **Specification Details** — per spec, a console-like check list with a pill per check with its automated result
  (`Passed`, `Failed`, `Skipped`, `Not Executed`; hover `Not Executed` for why). Each `test.describe` title appears once as an indented heading over its checks. Every
  failed, skipped or not executed check has a manual result box (blank = not checked, green tick = passed, red cross = failed), followed by a notes field and a sign-off block (tested by, date,
  signature).

## Interactive HTML

The HTML report is a working checklist. Its **Print / Save PDF** button prints it or saves it as a PDF.

- Clicking a manual result box cycles not checked → passed → failed; a failed row is highlighted red. Notes and
  sign-off fields are editable. Entries are saved in the browser's `localStorage` for that
  report file until **Clear entries** is used.
- Progress counters show manual checks completed (passed + failed) per spec and across all specs, and how many
  failed manually; a spec turns green when all its manual checks passed and red when any failed.
- **Show** filters checks (and hides specs / describe blocks with no match): all, failed / skipped / not executed automated result,
  pending manual check, failed manually. **Hide manually passed** hides ticked checks. The toolbar also expands or collapses
  specs, and prints. **Print / Save PDF** keeps the filled-in values, so a completed checklist can be archived as PDF.

## Usage

```bash
# After a local run (reads reports/results.json, writes reports/signoff-report.html)
npm run report:signoff

# Point at a downloaded playwright-report-<run_number> artifact and add run context
TARGET_ENV=qa BROWSER=chromium npm run report:signoff -- \
  --reports ./playwright-report/results.json \
  --output-dir ./reports
```

## CI integration

`.github/workflows/playwright-tests.yml` builds the report when it is started manually with the
`generate_signoff_report` input (default `false`; scheduled runs skip it). The `merge-reports` job, even when tests fail:

1. merges the shard blobs into `reports/results.json` and the HTML report;
2. runs `npm run report:signoff` with `TARGET_ENV` and `BROWSER` taken from the workflow inputs;
3. uploads `reports/signoff-report.html` as the `signoff-report-<run_number>-<run_attempt>` artifact.

Set the optional repository variables `APP_NAME` and `APP_DESCRIPTION` to name the application in the report header;
without them the report is titled "Playwright Start".

For another CI system, run the same command after the test step with an "always run" condition, point `--reports`
at the run's Playwright JSON report (screenshots are found through its attachment paths), and publish
`reports/signoff-report.html`. Branch, commit and build are read from the CI variables listed under
[How it works](#how-it-works).

## Branding

`scripts/report-template/` holds the look of the report: `logo.png`, `tokens.css` (colour tokens and typography),
`report.css` (layout, print rules) and `render.js` (HTML sections), `interactive.js` (browser behaviour of the HTML report). Change tokens there rather than in the script.

## Troubleshooting

- **All checks are `Not Executed`** — no JSON report found. Check `--reports`; the script warns when it is missing.
- **Many checks are `Not Executed` after one failure** — expected: specs run in serial mode, so Playwright stops the
  rest of the file after a failed test. Fix the first failure, or check those items by hand.
- **Failure has no screenshot** — API tests have no page, and `test-results/` must still exist when the report is
  built; the report shows "No screenshot captured." otherwise.

## Related

- [Flaky test analysis](flaky-test-analysis.md) — CI result collection and the metadata helpers reused here
- [Coverage gap analysis](coverage-gap-analysis.md) — structural coverage analysis
