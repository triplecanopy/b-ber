# TASK-149: Make main survive the first lockfile refresh

**Epic:** Dependency health
**GitHub Issue:** #755 — https://github.com/triplecanopy/b-ber/issues/755
**Scope:** lib, monorepo

## Description

Renovate's first lock file maintenance PR (#753, 2026-11-13) failed both CI
jobs. Neither failure is in the lockfile. Each is a bug on `main` that the old
lockfile happened to hide.

- **e2e: `Cannot find module 'yawn-yaml/cjs'`.** TASK-122 turned b-ber-lib's
  exact `yawn-yaml: 1.5.0` (what 4.0.3 publishes) into `^1.5.0`. That range now
  resolves to 1.8.0, which removed the `cjs/` directory. The lockfile PR only
  surfaced it: the next release would have failed on every fresh install, since
  users install without our lockfile.
- **typecheck: no declaration file for `htmlparser2`.** b-ber-lib runs
  htmlparser2 3.10, which ships no types. `tsc` had been reading the types of an
  unrelated htmlparser2 8 that npm hoisted to the root `node_modules`, because
  TypeScript looks for declarations in every ancestor `node_modules` before it
  settles for an untyped package. The refreshed lockfile hoisted 3.10 instead.

Separately, the lockfile PR had never opened on its own: it only appeared when
the Dependency Dashboard box was ticked.

## Subtasks

- [x] Upgrade b-ber-lib to `yawn-yaml ^1.8.0` and import `yawn-yaml`. 1.8 ships
      types, so the hand-written declaration goes
- [x] Compare yawn-yaml 1.5 and 1.8 on the YamlAdaptor scalar corpus (below)
- [x] Declare the slice of htmlparser2 3 that `HtmlToXml` uses; typecheck with
      the hoisted htmlparser2 8 types present and hidden
- [x] Renovate: give the lockfile PR the routine window, first priority, and no
      hourly cap
- [x] `npm test`, `npm run typecheck`, the e2e `cli` project

## Notes

### yawn-yaml 1.5 → 1.8

1.8 swaps its own js-yaml 3 for js-yaml `^4.1.0` (4.3.2 installed), which also
removes the vulnerable js-yaml 3 copy TASK-140 found under it. `Yaml.ts` reads
`config.yml`, `metadata.yml` and `media.yml` through it.

Run over the 52 scalar cases `yaml-adaptor.test.js` pins, plus a merge-key
document and a commented metadata list, 13 differ. All are YAML 1.1 number forms
or js-specific tags:

| Unquoted value | 1.5 (js-yaml 3) | 1.8 (js-yaml 4) |
| -------------- | --------------- | --------------- |
| `0123` | 83 | 123 |
| `1_000`, `1_000.5` | 1000, 1000.5 | strings |
| `1:23`, `190:20:30.15` | 83, 685230.15 | strings |
| `0o17` | `"0o17"` | 15 |
| `08`, `0128`, `012.34`, `00.5` | strings | 8, 128, 12.34, 0.5 |
| `!!js/undefined`, `!!js/regexp` | read | throw |
| `!!binary` | Buffer | byte-indexed object |

Booleans, nulls, dates, timestamps, merges and every quoted value are
unchanged. Writing back (`json` assignment) produced identical text, comments
kept. An unquoted value with leading zeros was already misread (as octal), so
nothing that worked before breaks; #748 tracks unquoted values in
`metadata.yml` generally. `YamlAdaptor` still keeps js-yaml 3's readings, so
`toc.yml` and the files above now disagree on those forms. That is recorded in
b-ber-lib's AGENTS.md.

### htmlparser2

Upgrading to 8 or 10 would drop the declaration, but changes parsing behaviour
and is a migration of its own. With the declaration in place, `tsc` still
prefers a real typed htmlparser2 when one is hoisted, so the result depends on
the install layout; it passes either way.

### Renovate

The lockfile PR's default schedule is "before 4am on monday", and
`config:recommended` allows two new PRs an hour. On 2026-11-09 the 02:58 run
(the only one in that window) opened two routine PRs, and the next ran at
04:39. Validated with `renovate-config-validator --strict` from Renovate
44.238.3; its only output is a pre-existing migration notice for
`dependencyDashboard: true`.
