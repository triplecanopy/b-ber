# TASK-127: Sweep declared dependencies against actual imports

**Epic:** Dependency health
**GitHub Issue:** #642 — https://github.com/triplecanopy/b-ber/issues/642
**Scope:** monorepo

## Description

Three of the four highest-value actions in the Dependabot work so far were
deletions, not upgrades — and **none of them were found by looking**:

| Removed | Alerts cleared | How it surfaced |
| ------- | -------------- | --------------- |
| `tar` (19 manifests) | 248 | auditing the alert distribution (TASK-120) |
| `sass-lint` | 6 | checking what a Dependabot group pattern still matched |
| `redux`, `react-redux`, `redux-thunk` | — | the same group-pattern audit listed `@reduxjs/*` |
| `bs-html-injector` | 21, **16 unpatchable** | tracing a transitive root |

Every one was a package that no source file imported. Dependabot cannot propose a
deletion — it can only propose a version — so this class of problem is invisible to
the tooling that is supposed to manage dependencies. The only thing that finds it is
looking, and so far nobody has looked deliberately.

This task does that sweep once, and leaves behind a script so it can be re-run.

### Why a naive check is not enough

"Declared but not imported" over-reports badly. A dependency can be legitimately
used without appearing in an `import`:

- **CLI-only** — `rimraf`, `syncpack`, `madge`, `lerna` are invoked from
  `package.json` scripts
- **Config-resolved** — `jest`, `@biomejs/biome`, `ts-jest`, `tsdown` are named in
  config files rather than imported
- **Type-only** — `@types/x` is pulled in by the compiler, never imported. It is
  used if and only if `x` is present
- **Ambient / side-effecting** — polyfills (`core-js`, `setimmediate`,
  `resize-observer-polyfill`) are imported for effect, sometimes from a config or
  entry shim
- **Peer or plugin resolution** — loaded by string name at runtime, e.g. a
  Browsersync plugin's `module:` field, which is exactly how `bs-html-injector`
  hid

So the script must check source imports **and** scripts **and** config files, and
treat `@types/*` as following its base package. Anything it cannot prove is used
gets reported as "needs a human", not "delete it".

### Scope

All 37 workspace manifests plus the root, `dependencies` and `devDependencies`.
First-party `@canopycanopycanopy/*` cross-dependencies are out of scope — lerna
manages those.

## Subtasks

- [x] Write `scripts/check-unused-deps.js` — declared vs. imported, with the
      exemptions above, reporting `unused` / `uncertain` separately
- [x] Run it and triage the output by hand; confirm each candidate individually
      before removing anything
- [x] Remove what is confirmed dead; verify with build, `npm test`,
      `check:circular` and a real `bber build epub` from `demos/basic`
- [x] Check the declared-but-alerting packages specifically — `postcss`,
      `image-size`, `js-yaml` — are they genuinely used where declared?
- [ ] Decide whether the script becomes a CI gate or stays a manual tool
- [ ] Re-measure alerts once merged and record what the sweep cleared

## Results (2026-09-23)

**46 declarations removed across 19 manifests.** The sweep reported 51 candidates;
five were false positives caught by hand, and four are deliberately held back.

| Removed | × | Note |
| ------- | - | ---- |
| `lodash` | 16 | 13 packages genuinely use it; these 16 declared it and never imported it |
| `xmlhttprequest-ssl` | 3 | |
| `concurrently`, `core-js`, `cssnano`, `handlebars`, `nodemon`, `postcss-cssnext`, `postcss-import` | 2 each | an old dev-server / CSS-pipeline setup, root + reader-react |
| `tar` | 1 | **the root still declared it** — TASK-120 cleared 19 package manifests and missed this one |
| `webpage`, `system` | 1 each | see below |
| `lerna-audit`, `mock-fs`, `sugarss`, `svgo`, `express`, `react-test-renderer` | 1 each | |
| `lodash.has`, `lodash.find`, `lodash.isundefined` | 1 each | all three pinned to `@latest`, which is a dist-tag, not a range — non-deterministic installs |

### `webpage` and `system` were never ours

`b-ber-tasks` declared `webpage@0.3.0` ("Webpage Boilerplate Component") and
`system@2.0.1` ("Flexible module and resource system"). Neither is imported, and
there is **no PhantomJS anywhere in the repo**. Those are the names of PhantomJS's
*built-in* modules, so at some point `require('webpage')` and `require('system')`
in a Phantom script were "fixed" by installing unrelated public packages of the same
name. That is dependency confusion, self-inflicted. The Phantom code is long gone;
the packages stayed.

### Five false positives, and what each taught the script

Every one of these would have broken something:

| Looked dead | Actually | Fix |
| ----------- | -------- | --- |
| `modularscale-sass` | `@use`d from `application.scss` | scan `.scss`/`.css`, and match `@use`/`@import`/`@forward` incl. the `~` prefix |
| `sass` (reader-react) | Vite compiles the package's 9 `.scss` files only if `sass` is installed | added to the known-non-imported list |
| `@testing-library/dom` | **peer dependency of `@testing-library/react`** — removing it broke 39 suites | the script now reads every declared dep's `peerDependencies` and treats those as used |
| `@types/react`, `@types/react-dom` | matched a `peerDependency`, not a dependency | `@types/x` now checks peers too |
| `bs-html-injector` (TASK-120) | resolved by string name in a plugin config | `uncertain` bucket for bare quoted references |

`@testing-library/dom` is the one that justifies the whole "confirm by hand" rule —
it failed loudly, but only after removal.

### Held back — four that need a decision, not a script

| Dep | Where | Why held |
| --- | ----- | -------- |
| `postcss@^7`, `autoprefixer@^9` | reader-react | Vite bundles its own PostCSS and there is no `postcss.config.*`, so these look inert — but being wrong means silently different CSS output. Worth an empirical before/after diff of the built stylesheet |
| `prop-types` | reader-react | only appears in *generated* bundle output, which suggests a dependency pulls it in rather than our source |
| `yargs@^13` | b-ber-lib | the only mention is a parameter *named* `yargs`, typed `any`, in `utils/index.ts`. Almost certainly dead, but `b-ber-cli` genuinely uses yargs and the two are easy to conflate |

### Confirmed genuinely used

`postcss`, `autoprefixer` and `sass` are real in `b-ber-tasks` (`src/sass/index.ts`),
so **their alerts need upgrades, not deletion** — worth knowing before anyone
tries the TASK-120 trick on them. `express` is real in the legacy `b-ber-reader`.

## Notes

- **Confirm before deleting.** `bs-html-injector` looked unused by grep and was
  not — it was resolved by string name in a plugin config. A false positive here
  costs a broken build; the script's job is to narrow the search, not to decide.
- Removing a dependency from N workspace manifests clears roughly N× its
  advisories, because alerts are counted per manifest path.
- A dependency removal is not finished until the **root** manifest is checked too.
  TASK-106 removed Redux from `b-ber-reader-react` and the root kept declaring
  `redux`, `react-redux` and `redux-thunk` for three months.
- Related: TASK-125 covers the transitive side (vulnerabilities in packages we do
  not declare). This task is the declared side.
