# TASK-134: Make the types refactor-ready

**Epic:** Migrate JS→TS
**GitHub Issue:** #687 — https://github.com/triplecanopy/b-ber/issues/687
**Scope:** monorepo

## Description

The goal is a refactor of the codebase. Tests are the first half of the safety
net (unit coverage, plus the e2e suite running against the real build since
TASK-130). **Types are the second half**: change a signature, and the compiler
should list every call site that has to follow.

TASK-119 makes `npm run typecheck` pass. That is necessary but not sufficient. A
codebase can typecheck cleanly while its most important types are `any`, and here
they are. This task is everything between "typecheck passes" and "the compiler
catches a refactor's breakage".

### Where the types stop (measured 2026-11-01, `main` @ `ee8af41c`)

**1. Our own packages are untyped to each other.** 27 ambient
`declare module '@canopycanopycanopy/…'` stubs stand in for internal imports: 20
in `b-ber-tasks/src/declarations.d.ts`, 7 in `b-ber-cli/src/declarations.d.ts`.
They look like this:

```ts
declare module '@canopycanopycanopy/b-ber-lib/State' {
  const state: any
  export default state
}
```

`State` is the shared singleton every build step reads and writes. In `b-ber-cli`
and `b-ber-tasks`, the two packages that coordinate everything else, it is
`any`, and so are the `b-ber-lib` utilities, `YamlAdaptor`, `Theme`,
`b-ber-templates` and the `b-ber-shapes-sequences` exports. **Rename a method on
`State` and nothing outside `b-ber-lib` fails to compile.** This is the single
biggest gap, and it is structural rather than a matter of annotation.

The stubs exist because consumers deep-import subpaths (`b-ber-lib/State`,
`b-ber-templates/…`) that ship no type declarations. Those packages have no
`exports` map with `types` conditions, and their published `dist/` has no `.d.ts`
at those paths. The fix belongs in the **providing** packages: emit
declarations for each public subpath and declare them, through an `exports` map
or `typesVersions`. Then delete the stubs and let the real types through. That
will surface type errors at the call sites, which is the point.

**2. Explicit `any`: 359 occurrences in tracked sources.** Concentrated:
`b-ber-tasks` 94, `b-ber-reader-react` 85, `b-ber-cli` 45, `b-ber-logger` 35,
`b-ber-parser-footnotes` 29, `b-ber-validator` 22, `b-ber-lib` 19. TASK-119's
pass 1 will add more, each marked `TASK-119 pass 1`. Biome's `noExplicitAny`
counted 378 (it also counts generics and type positions this grep misses).

**3. Other untyped code.**

- 23 non-internal `declare module` stubs for third-party packages without types
  (`pureimage`, `quote`, `yawn-yaml/cjs`, …).
- 2 `@ts-ignore`/`@ts-expect-error`.
- 4 legacy ES5 browser scripts in `b-ber-tasks/src/web/` that are not TypeScript.

The third-party stubs are lower priority: they guard calls into libraries, not
our own boundaries.

## Approach

**Boundaries first, then interiors.** A typed boundary between packages is worth
far more to a refactor than a typed local variable.

1. **Internal stubs → real types**, one providing package at a time, in
   dependency order: `b-ber-shapes-sequences`, then `b-ber-lib` (`State` above
   all), then `b-ber-templates`. For each, publish declarations for the
   subpaths consumers use and delete the matching stubs. Then fix what the
   compiler reports in `b-ber-tasks` and `b-ber-cli`. Each package is
   independently shippable.
2. **TASK-119 pass 2**: replace every `TASK-119 pass 1` marker with a real type.
3. **Existing explicit `any`**, by package, largest first, but prioritise
   exported signatures over internal ones. An `any` in a public function's
   parameters leaks into every caller.
4. **Third-party stubs**: replace with community `@types/*` where they exist,
   and with minimal hand-written declarations of what we actually call where
   they do not.

## Definition of done

Measured with the commands under "How each measure is taken" in the Step 2
result below. "Before" is `main` @ `496392aa` (TASK-119 and step 1 merged).

| Measure | Before | After (2026-11-07) | Done |
| ------- | ------ | ------------------ | ---- |
| Internal `declare module '@canopycanopycanopy/…'` stubs | 27 | **0** (step 1) | **0** |
| `TASK-119 pass 1` markers in `packages/` | 19 | **0** | **0** |
| `any` in published declarations (exported signatures) | 96 | **0** | **0**, or each one justified in a comment |
| Explicit `any` overall (Biome `noExplicitAny`) | 334 | **224** | target proposed below: **0 outside `b-ber-reader-react`** |
| Biome warnings, all rules | 351 | 241 | n/a |
| `@ts-ignore` / `@ts-expect-error` | 1 / 1 | 0 / 2, both justified | n/a |
| Third-party `declare module` stubs | 23 | 22, each annotated | `@types/*` or minimal |
| `npm run typecheck` | green (TASK-119) | green, 33/33 | green, and a required check (it is a step of `build-and-test`) |

## Subtasks

- [x] Measure explicit `any` in **exported** signatures specifically (the baseline
      for the definition of done): 96, see Step 2 result
- [x] `b-ber-shapes-sequences`: declarations for its public subpaths; delete its
      3 stubs
- [x] `b-ber-lib`: declarations for its public subpaths (`State` first); delete its
      stubs; fix the call sites the compiler reports
- [x] `b-ber-templates`: same; delete its 12 stubs
- [x] Confirm `b-ber-tasks/src/declarations.d.ts` and
      `b-ber-cli/src/declarations.d.ts` contain no internal stubs (cli's file is
      gone; it held nothing else)
- [x] TASK-119 pass 2: resolve every `TASK-119 pass 1` marker (19 left, down from
      the ~320 a pure-`any` pass would have left; see TASK-119's Result)
- [x] Explicit `any` reduction, exported signatures first, by package
- [x] Third-party stubs → `@types/*` or minimal declarations
- [x] Re-measure and record against the definition-of-done table
- [ ] Agree the overall-`any` target (proposed below)

## Step 1 result (2026-11-07): internal stubs 27 → 0

`b-ber-tasks` and `b-ber-cli` now compile against the real types of `b-ber-lib`,
`b-ber-shapes-sequences`, `b-ber-templates`, `b-ber-resources` and
`b-ber-validator`. A probe of deliberate misuse (`state.nope()`, a bogus `ensure`
argument, `sequences` assigned to `number`) fails to compile where it used to pass.
No `any` was needed to get there.

### Convention: a `.d.ts` beside the JS each public subpath resolves to

TypeScript 6 resolves with **`Bundler`** here (no `moduleResolution` is set), so
`exports` maps are honoured, and TypeScript finds a `.d.ts` next to whatever `.js`
a subpath resolves to.

- **b-ber-lib, b-ber-shapes-sequences:** a hand-written `X.d.ts` beside each root
  CJS shim `X.js` (`import { X } from './dist/index.js'; export = X`), listed in
  `files`. `export =` models the shim's `module.exports =`, so
  `import state from '…/State'` is typed as what it really is.
- **b-ber-templates:** no change needed. Its `exports` map already points at
  `dist/<subpath>.js`, and tsdown emits a `.d.ts` beside each.
- **Not an `exports` map for lib and shapes-sequences**, deliberately. Adding one
  would close off deep imports for outside users of the published packages, which
  is a breaking change and belongs to TASK-090. If TASK-090 adds one, the `.d.ts`
  files still sit beside its targets, so nothing here needs redoing. tsdown does
  not bundle our own packages into tasks or cli (they stay `require()` calls), so
  runtime resolution is untouched.

### Provider changes

- **b-ber-validator** built with `tsc` but emitted no declarations, and its types
  lived in an ambient `declare module` that emitted `.d.ts` could not reference.
  They moved to `src/types.ts`. `Result` is now a real union (`success: true` |
  `success: false`), as its comments already said.
- **`Template.render`'s `template` is a vinyl `File`, not a `string`.** 17 call sites
  passed a `BufferFile`, and `layouts` throws without a buffer `.contents`, so the
  annotation was wrong and the call sites right. The old stubs existed to paper
  over exactly this.
- **`State.toc` is `SpineItem[]` and `State.guide` is `GuideItem[]`** (were
  `unknown[]`). Needed once TASK-119's typed Toc/Ncx/Guide templates meet the real
  `State`.
- cli: `theme` narrows `command` to the builder's choices and awaits the handler,
  `config-options` casts `YamlAdaptor.parse`'s `unknown`, and `build.ts` stops
  passing an argument `Project.stylesheets()` never took.
- tasks: the third-party `layouts` stub's value type corrected to `VinylFile`.

### Verified

With TASK-119 merged in: `npm run typecheck` green in all 33 packages, `npm test`
131 suites / 1149 tests, and Biome's explicit-`any` warnings 394 → 351. A real
`bber new` → `build epub` (EPUBCheck clean) → `build web` succeeds from the built
CLI, as do `bber check` (validator report at runtime) and the kitchen-sink
fixture's web and reader builds.

### Defect surfaced (not fixed)

- `packages/b-ber-tasks/src/validate/index.ts:14`:
  `if (!fs.pathExists(markdownPath))` tests a Promise, so it is always false and
  the "project path does not exist" check never fires. It needs `await`. Filed as #736.

## Step 2 result (2026-11-07): markers 19 → 0, exported `any` 96 → 0

### How each measure is taken

Run from the repository root after `npm run build` (in a worktree, prefix the
npm scripts with `NX_WORKSPACE_ROOT_PATH=$(git rev-parse --show-toplevel)
NX_DAEMON=false`, see TASK-119):

```bash
# `any` in exported signatures: the `any` keyword in every declaration file our
# packages publish, i.e. tsdown/tsc's emitted dist/**/*.d.ts plus the
# hand-written root .d.ts shims. b-ber-reader (legacy) is excluded.
grep -rowE 'any' --include='*.d.ts' packages/*/dist packages/*/*.d.ts \
  | grep -v '^packages/b-ber-reader/' | wc -l
# ...by package: replace `wc -l` with `cut -d/ -f2 | sort | uniq -c`

# Explicit `any` overall
npx biome lint --only=suspicious/noExplicitAny --max-diagnostics=none \
  --reporter=github . 2>/dev/null | grep -c noExplicitAny

# Markers
git grep -c "TASK-119 pass 1" -- packages
```

The declaration-file measure is deliberately of the **emitted** `.d.ts`, not the
source. It counts exactly what crosses a package boundary, including `any` that
was never written: an inferred type that the declaration build could not
resolve (see the tsdown finding below), which a source grep misses. It would
count `any` in a comment too; there are none.

### Before → after by package

| Package | Published `.d.ts` | Biome `noExplicitAny` |
| ------- | ----------------- | --------------------- |
| `b-ber-validator` | 32 → 0 | 24 → 0 |
| `b-ber-lib` | 17 → 0 | 23 → 0 |
| `b-ber-tasks` | 8 → 0 | 48 → 41 |
| grammars and parsers (mostly the parsers' `plugin: (md: any, …, options?: any)`, re-exported by each grammar) | 37 → 0 | parsers 53 → 43; grammars 7 → 0 |
| `b-ber-logger` | 1 → 0 | 35 → 0 |
| `b-ber-templates` | 1 → 0 | 2 → 0 |
| `b-ber-markdown-renderer` | 0 | 2 → 0 |
| `b-ber-cli` | 0 (no consumers) | 40 → 40 |
| `b-ber-reader-react` | 0 (hand-written `index.d.ts`) | 100 → 100 |

No exported `any` remains, so none needs a justifying comment.

### What changed

- **`State` is typed.** `builds` is `Record<string, BuildSettings>`, the shape
  `loadBuildSettings` returns, so every getter (`spine`, `guide`, `cursor`,
  `footnotes`, `remoteAssets`, `loi`, …) has a real type. `theme` is a
  `ThemeModule`, `media` is media.yml's `id → build → MediaEntry`, and
  `metadata` is `Yaml<MetadataEntry[]>` (`Yaml` now takes the document's type).
  `figures` stays `unknown[]`: its type, `FigureData`, lives in b-ber-templates,
  which depends on b-ber-lib. Moving `FigureData` into b-ber-lib would finish
  the job.
- **The markers were fixed at their source**: b-ber-logger's `debug`/`trace`
  accept arguments (still no-ops), `ensureSource` accepts a null `lineNumber`,
  and `attributesString`/`attributesQueryString` take
  `Record<string, string | number | boolean>`.
- **One definition of the structural markdown-it types**, in **b-ber-lib**
  (`src/markdown.ts`): `DirectiveToken`, `FigureToken`, `RendererInstance`,
  `RendererContext`, `RendererReference`, `MarkdownItHost`, `BlockRule`, and the
  parsers' `ContainerPluginOptions`/`FigurePluginOptions`. b-ber-lib rather than
  b-ber-grammar-renderer or b-ber-parser-figure because it is the one package
  every parser and grammar already depends on; neither of those is a dependency
  of the container parsers, which need `MarkdownItHost`. The option types must
  be exported from a dependency, not declared in each parser, because the
  grammars re-export each parser's plugin and their emitted `.d.ts` has to name
  its types (tsdown fails with TS4082 otherwise). b-ber-grammar-epigraph keeps
  a local token type: it does not depend on b-ber-lib and is not registered.
- **b-ber-markdown-renderer is now the check.** Its two `as any` casts are gone,
  so registering each plugin on a real `MarkdownIt` instance checks the
  structural types against markdown-it's own. That is how the footnotes
  renderer type was caught being too narrow.
- **Known defects keep a narrow, named cast** rather than `any`: grammar-logo
  (#727), grammar-footnotes (#728), grammar-frontmatter (#735). grammar-epigraph's
  `instance` is typed as exactly what it reads (#720), so registering it before
  that is fixed will fail to compile.
- **Third-party stubs**: autoprefixer 10.6 ships its own types, which the
  ambient stub was shadowing; removed. The two `layouts` declarations (lib and
  tasks) disagreed about the layout map; aligned on vinyl files. The rest stay
  hand-written, each annotated with why: yawn-yaml, epub-zipper, pureimage 0.1,
  layouts and markdown-it-front-matter publish no types for the versions used;
  `@types/css` is not versioned against css 2.x; `@types/command-exists` would be
  a dependency for one signature. **No dependencies were added.**
  b-ber-reader-react's 14 shims were reviewed but not changed (see findings).
- **`@ts-ignore` → `@ts-expect-error`** in tasks' sass, with its comment
  corrected. The other `@ts-expect-error` (the `Reader` constructor returning a
  Promise) stays, and the `reader` task is now typed `() => Promise<void>`, which
  is what it returns.

### JS output

Every touched package's built `dist/**/*.js` was compared with a pre-change
snapshot. All are byte-identical except three, each provably equivalent (the
argument is in each commit body):

- b-ber-grammar-attributes: `Url.ensureDecoded(String(val))` for
  `Url.ensureDecoded(val)`. `decodeURIComponent` already applied `ToString`.
- b-ber-templates: `String(x)` passed to `RegExp#test` (three MIME checks) and
  to `String#replace` (image class, iframe width/height). Both apply
  `ToString` to such an argument themselves.
- b-ber-validator: three added comments, which tsc keeps.

### Verified

`npm run build`, `npm run typecheck` (33/33) and `npm test` (Biome 0 errors,
check:tasks, syncpack, 131 suites / 1149 tests) green. A real
`bber new demo` → `build epub` (EPUBCheck: 0 errors, 0 warnings) → `build web`
from the built CLI, outside the repository.

### Findings

- **tsdown's declaration build does not see ambient `declare module` stubs.**
  rolldown-plugin-dts builds its TypeScript program from the entry alone, so a
  `src/declarations.d.ts` that nothing imports is not in it. Typecheck sees the
  stub, so the source looks typed, but anything an exported signature *infers*
  from a stubbed module is emitted as `any`. That is where b-ber-tasks' `epub`
  and `Opf.createOpfPackageString` `any`s came from. Fixed by annotating those
  signatures; the rule is now written in tasks' `declarations.d.ts`, and the
  declaration-file measure above catches a regression. A general fix (making the
  stubs part of the dts program) is open.
- **`log.error` does not exit at log level 0** (`--quiet` or `--log-level=0`):
  `error()` returns before `process.exit`. Every caller that relies on it to
  stop the build carries on under `--quiet`. This is also why `log.error` cannot
  be typed `never`, which would otherwise narrow every call site. Not fixed:
  behaviour.
- **sass's `errLogToConsole`** is a node-sass option that dart-sass ignores. Dead,
  but removing it changes the options object, so it was left.
- **b-ber-reader-react's `@types/css-tree` (2.3.11) does nothing.** `XMLAdaptor`
  imports css-tree's subpaths (`css-tree/parser`, …), which `@types/css-tree`
  does not declare, so the local shim types them as `any`. Either the shim
  re-exports `@types/css-tree`'s types for each subpath (which will surface
  type errors in `XMLAdaptor`'s node mutation) or the devDependency can go.
  Reader work, under its conventions; not changed here.
- **Suspected:** metadata.yml values YAML parses as dates or numbers (an
  unquoted `2020-01-01`) reach the templates as `Date`/`number`, while every
  reader types and interpolates them as strings. The scaffolded `date` is the
  placeholder `YYYY-MM-DD`, so it is not hit by default. Traced, not run.
- The `TASK-119 pass 1` string still appears in `tasks/TASK-119.md` (closed) and
  this file, so a repository-wide `git grep` is not empty; the measure is scoped
  to `packages/`.

### Proposed target for overall explicit `any`

**0 outside `b-ber-reader-react`, with any exception justified in a comment at
the site.** That is 224 → about 100 (the reader's). Reasoning, by what is left:

| Where | Count | What it is | Route to 0 |
| ----- | ----- | ---------- | ---------- |
| `b-ber-reader-react` | 100 | DOM/html-to-react node walking, css-tree, legacy props | under Reader quality (#713) and its migration conventions, not here |
| `b-ber-tasks` | 41 | task interiors: metadata/spine entries, YAML, mobi/web/xml helpers | mostly mechanical now that `State` is typed; the package a refactor touches most |
| `b-ber-cli` | 40 | yargs builders and `argv` in every command | type against yargs 13 (the CLI pins `yargs@^13`; the `@types/yargs` in node_modules is jest's, for 17), or a small `Argv` interface per command |
| parsers (footnotes 27, gallery 12, others 4) | 43 | markdown-it `StateBlock`/`StateInline` in the rule functions | one structural `BlockState`/`InlineState` in b-ber-lib's `markdown.ts`; `MarkdownItHost`'s `BlockRule` would then take it instead of `unknown` |

These are interiors, so none of them leaks into another package any more. But
tasks and cli are where a refactor will land first, and the parsers' 43 go with
one shared type. Once a package reaches 0, Biome can hold it there with an
`overrides` entry setting `noExplicitAny` to `error` for that path. That is a
rule-level change, so it belongs to TASK-133.

## Notes

- **Depends on TASK-119 pass 1.** Until `typecheck` is green and in CI, there is
  no way to tell new type errors from old ones. Step 1 here will produce many new
  ones, and they need to be visible.
- **Step 1 overlaps TASK-090** (ESM format and an `exports` map, for
  reader-react). An `exports` map with `types` conditions is the same mechanism.
  Agree the shape across packages before the first one lands, or this task and
  TASK-090 will produce two conventions.
- Watch for the TASK-112/tsdown lesson: tsdown bundles flat, so whether `dist/`
  contains per-subpath files at all decides how subpath declarations can be
  published. Check each package's build output before choosing.
- Biome's `noExplicitAny` (enabled by TASK-119) and `noImplicitAnyLet` (TASK-133)
  give a running count. Use those rather than grep once they are on.
- Related: TASK-119 (green typecheck), TASK-133 (Biome recommended rules),
  TASK-090 (exports map), TASK-130 (e2e against the real build, the other half
  of the safety net), TASK-019 (the original migration).
