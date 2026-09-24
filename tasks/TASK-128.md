# TASK-128: Jest is intermittently red in the run following an install

**Epic:** Unit test coverage
**GitHub Issue:** #646 — https://github.com/triplecanopy/b-ber/issues/646
**Scope:** monorepo

## Description

`npm test` fails in the **single run immediately following an `npm install`,
`npm uninstall` or `git stash -u`**, then passes indefinitely afterwards. Observed
on three separate branches on 2026-09-23 while doing dependency work
(TASK-120, TASK-127, the lerna upgrade), so it predates all of them.

### Shape of the failure

| | |
| --- | --- |
| Suites | 1–2 failed, 128–129 passed, 130 total |
| Tests | 15–19 failed out of 1026 |
| Which suite | **not yet captured** — it did not reproduce once anyone was looking |
| Recovery | none needed; 8–16 consecutive runs pass afterwards |

The failing suite has never been identified, because every attempt to capture it
in a loop came back clean. That is itself a clue: it needs the filesystem to have
been rewritten *just* before the run.

### Why it matters

It is almost certainly benign locally — re-run and it is green. But
`.github/workflows/ci.yml` does exactly the sequence that triggers it:

```yaml
- run: npm ci --ignore-scripts
- name: Build
  run: npm run build
- name: Lint and test
  run: npm test
```

`npm ci` rewrites the entire tree, then tests run against it. `build` sits between
them and takes a few seconds, which may be what has kept CI green so far — but that
is luck, not design. With `build-and-test` now a **required** status check on `main`
(TASK-117), a spurious red blocks merges and trains people to hit re-run, which is
exactly the habit that makes a real failure invisible.

### Leading hypothesis

Jest's haste map / transform cache going stale against a tree that changed under it.
`jest --clearCache` between install and test would confirm or eliminate this
cheaply. The `@swc/jest` transform cache is the other candidate.

Not yet ruled out: a genuine race in a suite that touches the filesystem — several
create real temp dirs since `mock-fs` was dropped for Node 24 incompatibility.

## Subtasks

- [ ] Reproduce deliberately and **capture which suite fails** — script
      `npm install && npm test` in a loop and keep the first failing output
- [ ] Confirm or eliminate the cache hypothesis (`jest --clearCache` between the
      two, see whether the failure disappears)
- [ ] If it is the cache: decide where the clear belongs — a `pretest` hook is
      tempting but would slow every local run; better may be `--ci` in the
      workflow, or clearing only in CI
- [ ] If it is a real race: fix the suite
- [ ] Check whether CI has ever actually hit this — search recent
      `build-and-test` runs for a red that passed on re-run with no code change

## Notes

- Do **not** "fix" this by adding a retry. A required check that passes on the
  second attempt is a check nobody trusts.
- Observed three times, always within a minute of an npm operation, never
  otherwise. It has never failed twice in a row.
- Worth checking whether it correlates with the packages whose tests import a
  sibling's built `dist` — those are the ones most exposed to a tree that is
  mid-rewrite, and they are the reason `build` precedes `test` at all.
