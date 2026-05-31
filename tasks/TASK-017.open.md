# TASK-017: Expand architecture diagrams with tooling, dependency versions, and cross-references

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

The current `docs/diagrams/` set (TASK added via previous session) shows
package structure and data flow but is silent on tooling state, dependency
versions, and inter-diagram navigation. The goal of this task is to make the
diagrams a living audit surface — readable at a glance to answer "what is
out of date?", "what is out of sync across packages?", and "what tooling does
this package actually use?".

Eventually these could be generated from `package.json` files by a script
(making them always current), but the first iteration is hand-maintained to
establish the schema before automating it.

### What to add

**1. Tooling and version matrix diagram** (`06-tooling-matrix.md`)

A single diagram (or table-based diagram) showing the current tooling state
across every package. Covers:

- Node.js engine target (per `package.json` `engines.node`)
- Babel config (which preset, which env target)
- Jest version and test transform (`babel-jest` vs `@swc/jest`)
- Module format emitted (`cjs` / `esm` / `umd`)
- Bundler used (`webpack` / `vite` / none)
- Build output (`dist/` emitted vs source-only)

This diagram is the primary audit surface for TASK-008 (TS migration):
"which packages have been converted and which still use babel-jest?"

**2. External dependency version diagram** (`07-external-dependencies.md`)

Groups key external deps across the monorepo by concern and shows version
ranges in use. Flags deps that:

- Are pinned to old majors (e.g. `jest: ^26`, `babel-jest: ^24`, `fs-extra: ^8`)
- Are deprecated (individual lodash method packages: `lodash.isundefined`, etc.)
- Have known conflicts (Babel 6 remnant `babel-cli: ^6.26` alongside Babel 7)
- Should be consolidated to a single version hoisted to the monorepo root

Current known issues to capture:

- `jest: ^26.6.3` — current stable is v29; `^26` predates the modern
  `jest.config.js` `testEnvironment` split and the removal of `testURL`
- `babel-jest: ^24.8.0` — several major versions behind `@babel/core: ^7`
- `fs-extra: ^8.1.0` — current is v11; `^8` predates the promise-first API
  becoming default
- `typescript: ^4.0.5` — current stable is v5; TypeScript 5 is required for
  `satisfies`, const type parameters, and decorator metadata
- `webpack: ^5.74.0` — not stale, but targeted for replacement in TASK-006
- `react: ^19` at root but reader-react likely expects specific peer deps
- `lodash.isundefined` and other individual lodash method packages (deprecated)

**3. Per-package detail diagrams** (one file per package, `pkg/` subdirectory)

Each package gets a diagram covering:

- What the package does (one-line description)
- Direct internal dependencies (links to diagram 02)
- Key external dependencies with versions
- Build tooling (transform, output format)
- Test setup
- Any open tasks or known issues

These are the "zoom in" view for a specific package. Diagram 02
(package-dependencies.md) is the "zoom out" view.

Structure per file (`docs/diagrams/pkg/<name>.md`):

```
# <package-name>

<one-line description>

## Dependency graph
<mermaid: internal deps only — links conceptually to 02-package-dependencies>

## Tooling
| Concern | Value |
...

## External dependencies
| Package | Version | Status |
...

## Known issues / open tasks
- ...
```

**4. Cross-references between existing diagrams**

Add a `## See also` or navigation footer to each existing diagram so they
function as a linked set rather than standalone files:

```markdown
## See also

- [Architecture overview](01-architecture-overview.md)
- [Package dependency graph](02-package-dependencies.md) — full dep map
- [Build pipeline](03-build-pipeline.md) — step ordering and State flow
- [Markdown rendering layer](04-markdown-rendering-layer.md) — grammar/parser detail
- [Reader React](05-reader-react.md) — browser reader component tree
- [Tooling matrix](06-tooling-matrix.md) — versions and build tooling per package
- [External dependencies](07-external-dependencies.md) — version audit
```

**5. Automation script** (stretch goal — can be a separate task)

A Node.js script (`scripts/update-diagrams.js`) that reads each
`packages/*/package.json` and regenerates the tooling matrix and external
dependency diagrams. This ensures the version audit is always current without
manual maintenance. The per-package detail diagrams would be templated:
the tooling/version tables are generated, and the description/known-issues
sections are hand-maintained.

## Subtasks

- [ ] Write `docs/diagrams/06-tooling-matrix.md`
  - One row per package (or per package group)
  - Columns: Node target, Babel preset, Jest version, transform, module format, bundler
  - Highlight packages that differ from the expected post-TASK-008 state
- [ ] Write `docs/diagrams/07-external-dependencies.md`
  - Group by concern: test tooling, build tooling, Node stdlib replacements, UI
  - Flag stale / deprecated / conflicting entries (see "known issues" above)
- [ ] Create `docs/diagrams/pkg/` subdirectory with one file per package
  - Priority packages first: b-ber-lib, b-ber-tasks, b-ber-cli, b-ber-reader-react,
    b-ber-markdown-renderer (the high-traffic packages)
  - Grammar/parser packages can share a template and be filled in bulk
- [ ] Add `## See also` cross-reference footers to diagrams 01–05
- [ ] Add a `docs/diagrams/README.md` as an index (diagram title, one-line
      description, what questions it answers)
- [ ] (Stretch) Write `scripts/update-diagrams.js` to generate/refresh the
      version table sections from `package.json` files

## Notes

- Diagram files use Mermaid fenced code blocks; they render natively in
  GitHub, VS Code (Mermaid extension), and any CommonMark viewer with
  Mermaid support
- The eventual dynamic web interface (mentioned as a future goal) could use
  the same Mermaid source embedded in a React component — no format migration
  needed, just a rendering layer on top
- For the tooling matrix, `testURL` still appears in many `jest.config.js`
  files — this is a deprecated Jest 26 option removed in Jest 27+. It should
  be flagged in the matrix as a migration blocker for the Jest upgrade
- The `## See also` cross-references should use relative paths so they work
  both on GitHub and in local viewers
- See TASK-016 for the structural risks (implicit deps, mixed CJS/ESM) that
  the per-package diagrams should capture
