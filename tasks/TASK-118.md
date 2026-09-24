# TASK-118: Retire CircleCI, porting what it still does to GitHub Actions

**Epic:** Upgrade tooling
**GitHub Issue:** #604 — https://github.com/triplecanopy/b-ber/issues/604
**Scope:** monorepo

## Description

CircleCI reports nothing to GitHub — no commit statuses, no check runs, on PRs or
on `main` (established in TASK-117). It is not gating anything, and TASK-117's
`ci.yml` now covers its `build` job's core work. So it should go.

**But it is not a straight deletion.** `.circleci/config.yml` still encodes three
things `ci.yml` does not, two of which are finished task work:

| What | Whose work | Covered by `ci.yml`? |
| ---- | ---------- | -------------------- |
| build + lint + unit tests | — | ✅ yes |
| `check:circular` | TASK-022 | ✅ added in TASK-117 |
| **coverage → Codecov** | TASK-049, TASK-092 | ❌ no |
| **e2e (Playwright)** | TASK-039–044 | ❌ no |

Deleting `.circleci/` before porting those would silently drop an entire epic's
output. Port first, delete last.

### The e2e job is the real work

`packages/b-ber-testing` is a Playwright suite (`playwright.config.ts`, `fixtures/`)
and the CircleCI job does considerably more than run it:

- `node:24-bookworm` image
- `apt-get install -y zip default-jre-headless` — `epub-zipper` needs both for the
  EPUB build
- `npx playwright install-deps chromium` + `npx playwright install chromium`
- builds the kitchen-sink fixture via `node packages/b-ber-cli/dist/index.js build reader`
- `npm link` so the `bber` binary is on PATH (there is a comment in the CircleCI
  config about npm 10 not creating `node_modules/.bin/bber` when `dist/index.js`
  is absent at install time — worth reading before porting)
- then `npm test` in the e2e package

On Actions this is a separate job, probably on `ubuntu-latest` with
`actions/setup-node`, and the Playwright browser cache is worth caching. Expect
this to need a couple of iterations — it is the most environment-sensitive thing
in the repo.

### Coverage

`npm run test:coverage` then upload. CircleCI used the Codecov CLI directly rather
than the orb's default, because of a check the orb's `binary` param works around
(TASK-092). On Actions, `codecov/codecov-action` is the equivalent. The repo is
**public**, so tokenless upload will work, but Codecov now recommends a
`CODECOV_TOKEN` even for public repos — decide which, and note that a token is
another secret to rotate.

### Also dead once CircleCI goes

The root `postpublish` hook runs `scripts/run-ci.js`, which POSTs to CircleCI's API
to trigger a remote pipeline using `BBER_CI_*` env vars. It has been inert anyway
(the root is `private: true`, so `postpublish` never fires — noted in AGENTS.md
§ Releases), but retiring CircleCI makes it unambiguously dead. Remove the script,
the `postpublish` entry, and any `BBER_CI_*` configuration.

## Subtasks

- [ ] Port coverage to `codecov/codecov-action`; decide tokenless vs `CODECOV_TOKEN`
- [ ] Confirm coverage still lands in Codecov and the badge in `README.md` works
- [ ] Port the e2e job to Actions (system deps, Playwright install + cache, fixture
      build, `bber` on PATH, run the suite)
- [ ] Get e2e green in Actions **before** deleting anything
- [ ] Delete `.circleci/` and `codecov.yml` if it is CircleCI-specific
- [ ] Remove `scripts/run-ci.js`, the root `postpublish` entry, and `BBER_CI_*`
      references
- [ ] Update the CircleCI references in `AGENTS.md` and `README.md` (badge).
      Leave closed task files alone — they are historical record
- [ ] Remove the CircleCI app's repository access on the GitHub side, and the
      project on CircleCI
- [ ] Consider whether the Actions e2e job should be a required status check too,
      or left advisory because of its runtime

## Notes

- **Do not delete `.circleci/config.yml` first.** It is the only written record of
  how to build the e2e environment; port from it, then remove it.
- The staged `--concurrency=1` build in the CircleCI config exists for a reason
  that is not documented. `ci.yml` uses a plain `npm run build` and passes, so the
  staging may have been working around an older constraint — but if the Actions
  build turns flaky under memory pressure, that config is where to look.
- Raised by the user on 2026-09-22: "let's retire circleci, it's not doing
  anything". Correct that it is not gating anything; the caveat is that it still
  *describes* work worth keeping.
- Related: TASK-117 (the Actions gate that replaces its `build` job), TASK-035
  (CircleCI modernization — this reverses it), TASK-049 / TASK-092 (Codecov),
  TASK-039–044 (the e2e pipeline), TASK-045 (release workflow).
