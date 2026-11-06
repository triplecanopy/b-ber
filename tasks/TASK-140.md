# TASK-140: Upgrade js-yaml 3 → 5 (CVE-2025-64718 and four others)

**Epic:** Dependency health
**GitHub Issue:** _to be created_
**Scope:** lib, testing

## Description

Renovate PR #680 is a `[security]` update of `js-yaml` from `^3.12.0` to
`^5.0.0`, two majors, in `b-ber-lib`. The lockfile had **3.13.1**, which five
advisories cover:

| Advisory                             | Issue                                    | Fixed in             |
| ------------------------------------ | ---------------------------------------- | -------------------- |
| CVE-2025-64718 / GHSA-mh29-5h37-fv8m | prototype pollution through `<<` merge   | 3.14.2, 4.1.1        |
| CVE-2026-53550 / GHSA-h67p-54hq-rp68 | quadratic CPU, repeated merge aliases    | 3.15.0, 4.2.0        |
| CVE-2026-59869 / GHSA-52cp-r559-cp3m | quadratic CPU, merge-key chains          | 3.15.0, 4.3.0        |
| GHSA-5p4m-2wfm-xmqj                  | quadratic CPU, `!!omap`                  | 3.15.1, 4.3.1, 5.2.1 |
| CVE-2026-84375 / GHSA-2883-xcg3-v3hh | `maxTotalMergeKeys` skips empty mappings | 3.15.2, 4.3.2, 5.4.1 |

Every input is an author's own project file, so b-ber's exposure is narrow, as
with TASK-139. The main reason to take the major is that 3.x is now the
`v3-legacy` line.

This is the "kind 3" path in
[`docs/dependency-update-policy.md`](../docs/dependency-update-policy.md).

### Where js-yaml is used

There are two separate paths, and only the first is the one Renovate bumped:

| Path                           | Reads / writes                                                                                                                                                                                                    | Library                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `b-ber-lib/src/YamlAdaptor.ts` | `toc.yml` (Spine, Navigation, generate); `config.yml` (`bber theme set` rewrites it, deploy, `bber new --config`); `metadata.yml` (cover); every Markdown file's front matter; writes `config.yml` for `bber new` | js-yaml, direct                                             |
| `b-ber-lib/src/Yaml.ts`        | `config.yml`, `metadata.yml`, `media.yml` into `State`; rewrites `metadata.yml` when a cover is generated                                                                                                         | `yawn-yaml@1.5.0`, which depends on `js-yaml ^3.4.2` itself |

`b-ber-testing`'s Playwright specs also import js-yaml directly (`^4.1.0`) to
read `toc.yml`.

### What changed between 3 and 5 that reaches us

From the 4.0 and 5.0 changelogs and both migration guides:

- `safeLoad`/`safeDump` are gone, and there is no default export.
- `load()` uses the YAML 1.2 core schema. js-yaml 3's safe schema used YAML
  1.2 booleans but YAML 1.1 ints, floats and timestamps, plus `<<` merge. Under
  the core schema `date: 2019-01-01` becomes a string rather than a `Date`,
  `0123` becomes 123 rather than 83, and `1_000`, `1:23` and `<<` stop meaning
  anything. The `YAML11_SCHEMA` option is no closer: it makes `yes`/`no`/`on`/`off`
  booleans, which js-yaml 3 never did.
- `load('')` and a comment-only document throw. js-yaml 3 returned nothing, and
  an empty front matter block reaches the adaptor as `''`.
- The dumper no longer quotes strings that contain `:`, `,` or `#`, and quotes a
  whitespace-only string with double quotes. So `bber new` and `bber theme set`
  would write different text: `remote_url: http://…` instead of
  `remote_url: 'http://…'`.
- `!!set` loads as a `Set`, `!!binary` as a `Uint8Array`, and complex mapping
  keys throw.
- Tab indentation, empty flow entries (`[x,,y]`) and impossible dates
  (`2020-02-30`) are rejected or left as strings. js-yaml 3 accepted all three
  and produced the wrong values.
- Error messages say `(line:col)` rather than `at line X, column Y`. Nothing
  matches on them.

### Native replacement: rejected

Node has no YAML parser, and a hand-written one is not a credible option. The
choice was which js-yaml line to use.

## Approach

**js-yaml 5 behind `YamlAdaptor`, configured to give js-yaml 3's results**, so
books read and write exactly as before:

- **A load schema** (about 50 lines) built from js-yaml 5's own tags: core bool
  and null, YAML 1.1 ints (minus a trailing `_`, and with no `-0`), js-yaml 3's
  exact float pattern, timestamps, merge, `!!omap`, `!!pairs`, and stringified
  complex keys. `!!binary` and `!!set` are left out on purpose. js-yaml 5 would
  build different types for them, and an unknown-tag error is better than a
  silently different value.
- **One dump rule** (`scalarStyleRules`, the documented 5.4 option). It
  single-quotes strings that contain `, [ ] { } : #` or are only spaces, as
  js-yaml 3 did.
- **`parse()` returns `undefined` for an empty stream** instead of throwing.

The alternative was `^3.15.2`. It is patched for all five advisories, needs no
code changes, and the existing range already allows it. It was not taken
because 3.x is a legacy line whose fixes have lagged, and Renovate would keep
proposing 5. The compatibility code is small, uses only public API, and every
line of it is pinned by a test written against js-yaml 3.

**yawn-yaml keeps its js-yaml 3**, now resolved to **3.15.2**, which is patched
for all five. Its calls (`load` and `dump`) give identical results on 3.13.1 and
3.15.2 for every YAML file and front matter block in the repo, apart from the
`__proto__` fix.

## Changes

- `b-ber-lib`: `js-yaml ^3.12.0` → `^5.5.0`; `@types/js-yaml` removed (5 ships
  its own types). `YamlAdaptor.ts` is rewritten as described above.
- `b-ber-testing`: `js-yaml ^4.1.0` → `^5.5.0`, `@types/js-yaml` removed, and
  the three specs use the named `load` import. That ends the 3-vs-4 split
  TASK-122 flagged.
- `package-lock.json`: hoisted `js-yaml` 3.13.1 → 3.15.2. This one copy serves
  yawn-yaml, `cosmiconfig@5` and `@istanbuljs/load-nyc-config`, all within
  their ranges.
- `b-ber-lib/AGENTS.md`: corrected. It credited `YamlAdaptor` with yawn-yaml's
  comment preservation, and it now says what the adaptor's tests guarantee.

## Subtasks

- [x] Inventory every js-yaml call site, including the indirect yawn-yaml path
- [x] Read the 4.0 to 5.5 changelogs and both migration guides
- [x] Corpus comparison of 3.13.1 and 5.5.0 (see Verification)
- [x] Parity tests written and committed against js-yaml 3 **before** the upgrade
- [x] Bump `b-ber-lib` and `b-ber-testing`, and update the hoisted 3.x copy
- [x] Compatibility schema and dump rule; the parity tests pass unchanged
- [x] Tests for the deliberate differences and the advisory payloads
- [x] Real-build comparison against a v3 baseline
- [x] `npm test`, typecheck, Playwright `cli`, `npm audit`
- [ ] Merge; confirm Renovate closes #680 as superseded

## Verification

**Library comparison**, js-yaml 3.13.1 against 5.5.0 with the adaptor's
configuration:

- **Load:** all 60 YAML documents in the repo (every tracked `.yml` file, every
  Markdown front matter block, and both Project templates) give identical
  values. So do 756 generated documents covering every boolean, null, int,
  float and timestamp spelling, each as a value, a sequence item and a key,
  apart from 15 deliberate differences:
  - impossible or pre-100 dates (9);
  - a bare `!` tag (3);
  - inputs that both versions reject, with different messages (3).
- **Dump:** byte-identical for the default config, and for every document in
  the repo re-dumped the way `bber theme set` does it. The remaining
  differences are all inputs that never reach b-ber's writers, and each one
  reads back to the same value:
  - strings like `0128` (js-yaml 5 quotes them, which is safer);
  - astral characters (written literally instead of `\U` escapes);
  - strings over 80 characters with no spaces (plain instead of a `>-` block
    with nothing to fold);
  - `1e21`.
- **Round trip:** everything js-yaml 5 writes reads back to the same value
  through js-yaml 3.13.1, 3.15.2 (yawn-yaml) and the adaptor.

**Parity tests:** `b-ber-lib/__tests__/yaml-adaptor.test.js` (72 cases) and the
`config.yml` text test in `b-ber-templates/__tests__/Project.test.js` were
committed against js-yaml 3 first, then passed **unchanged** on 5. The
deliberate differences have their own `describe` block. The three merge-key
advisory payloads are tests too; each now fails in milliseconds.

**Real builds**, run with the built CLI on v3 (`main`) and again on v5. The
scenarios were:

- `bber new` with CLI options and a `--config` YAML file;
- `bber theme set` on the kitchen-sink and `demos/basic` configs;
- `bber generate`;
- kitchen-sink `epub` and `web` with a listed cover;
- kitchen-sink `epub` with a generated cover, which has yawn-yaml rewrite
  `metadata.yml`.

All **241 output files are identical** once per-build randomness is
normalized, and the build logs have the same warnings and errors. Two v3 runs
were compared first to set the noise floor. The only run-to-run differences are
the OPF manifest order and the web manifest and search-index order, which
TASK-139 already found and which are compared as sets here.

**Gates:**

- `npm test`: 131/131 suites, 1142 tests.
- Typecheck: `b-ber-lib` is clean, and no package gained an error. The six
  packages that fail typecheck fail on `main` with the same implicit-`any`
  errors.
- Playwright `cli`: 16/16.
- `npm audit`: js-yaml went from three vulnerable copies to one (see Findings).

## Findings

- **yawn-yaml reads user config with js-yaml 3's unsafe `load`.** `Yaml.ts`
  (config, metadata, media) goes through yawn-yaml 1.5.0, which calls js-yaml
  3's full-schema `load`. That schema includes `!!js/function`, and js-yaml 4
  removed it for being unsafe. The files are the author's own, so this is
  hardening, not an exploit path. yawn-yaml 3.0.0 is built on `yaml` (eemeli),
  not js-yaml, so moving to it changes the parser under `State` and is its own
  task.
- **lerna pins `js-yaml` exactly at 4.3.0**, which is still flagged
  (GHSA-5p4m, GHSA-2883). It is dev-only and parses only our own `lerna.json`.
  It clears when lerna updates, or with an `overrides` entry under TASK-125's
  rules. Not done here.
- **`bber generate` writes invalid front matter for some titles.** The title is
  interpolated unquoted, so `bber generate "New: Page"` writes
  `title: New: Page`, which no YAML parser accepts. This happens on 3 and 5
  alike, so it is not a js-yaml issue.
- **The `@types/lodash` lockfile drift from TASK-139 is still there.** `npm
install` resyncs it every time, and the resync is again left out of this PR.

## Notes

- Renovate PR: #680. Related: TASK-139 (the same kind-3 path for image-size),
  TASK-122 (the js-yaml 3-vs-4 split, now resolved to 5 everywhere except
  yawn-yaml's own copy), TASK-125 (overrides), TASK-132 (impact report).
