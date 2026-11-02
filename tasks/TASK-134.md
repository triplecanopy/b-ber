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

Measured with the same commands as above:

| Measure | Now | Done |
| ------- | --- | ---- |
| Internal `declare module '@canopycanopycanopy/…'` stubs | 27 | **0** |
| `TASK-119 pass 1` markers | (pass 1 not started) | **0** |
| Explicit `any` in exported signatures | not yet measured | **0**, or each one justified in a comment |
| Explicit `any` overall | 359 | tracked down; target agreed once 1–3 are done |
| `npm run typecheck` | red (TASK-119) | green, and a required check |

## Subtasks

- [ ] Measure explicit `any` in **exported** signatures specifically (the baseline
      for the definition of done)
- [ ] `b-ber-shapes-sequences`: declarations for its public subpaths; delete its
      3 stubs
- [ ] `b-ber-lib`: declarations for its public subpaths (`State` first); delete its
      stubs; fix the call sites the compiler reports
- [ ] `b-ber-templates`: same; delete its 12 stubs
- [ ] Confirm `b-ber-tasks/src/declarations.d.ts` and
      `b-ber-cli/src/declarations.d.ts` contain no internal stubs
- [ ] TASK-119 pass 2: resolve every `TASK-119 pass 1` marker
- [ ] Explicit `any` reduction, exported signatures first, by package
- [ ] Third-party stubs → `@types/*` or minimal declarations
- [ ] Re-measure and record against the definition-of-done table

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
