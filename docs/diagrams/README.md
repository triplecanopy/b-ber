# Architecture Diagrams — Index

Visual reference for the b-ber monorepo architecture. All diagrams use
[Mermaid](https://mermaid.js.org/) and render natively on GitHub and in VS Code
(with the Mermaid extension).

## Diagram set

| File | Title | What question does it answer? |
| ---- | ----- | ----------------------------- |
| [01-architecture-overview.md](01-architecture-overview.md) | Architecture Overview | What does b-ber do end-to-end, and what packages are involved? |
| [02-package-dependencies.md](02-package-dependencies.md) | Package Dependency Graph | Which packages depend on which other packages in the monorepo? |
| [03-build-pipeline.md](03-build-pipeline.md) | Build Pipeline | In what order do build steps run, and what does each step do? |
| [04-markdown-rendering-layer.md](04-markdown-rendering-layer.md) | Markdown Rendering Layer | How do grammar and parser packages transform Markdown into EPUB XHTML? |
| [05-reader-react.md](05-reader-react.md) | Reader React | How does the browser reader work internally (components, store, pagination)? |
| [06-tooling-matrix.md](06-tooling-matrix.md) | Tooling Matrix | What build tool / test runner / Node target does each package use? What is out of date? |
| [07-external-dependencies.md](07-external-dependencies.md) | External Dependencies | Which deps are stale, deprecated, conflicting, or should be consolidated? |

## Per-package detail pages (`pkg/`)

Zoom-in views for individual packages. Each covers: what the package does,
internal dependencies, key external dependencies with versions, build tooling,
test setup, and open issues.

| File | Package | Priority |
| ---- | ------- | -------- |
| [pkg/b-ber-lib.md](pkg/b-ber-lib.md) | b-ber-lib | High (imported by all packages) |
| [pkg/b-ber-tasks.md](pkg/b-ber-tasks.md) | b-ber-tasks | High (build orchestrator) |
| [pkg/b-ber-cli.md](pkg/b-ber-cli.md) | b-ber-cli | High (entry point) |
| [pkg/b-ber-reader-react.md](pkg/b-ber-reader-react.md) | b-ber-reader-react | High (user-facing reader) |
| [pkg/b-ber-markdown-renderer.md](pkg/b-ber-markdown-renderer.md) | b-ber-markdown-renderer | High (rendering pipeline) |

Grammar and parser packages share a common structure; their per-package pages
will be added in a follow-up batch (TASK-017).

## How to read these diagrams

- Arrows point **from dependent to dependency** in graph diagrams
- `-.->` (dashed arrow) means an implicit or optional relationship
- Mermaid `subgraph` blocks group related nodes visually
- Status flags (STALE, DEPRECATED, etc.) in the matrix and dependency diagrams
  are explained in the legend at the top of each file

## Maintenance

These diagrams are hand-maintained as of the initial creation (2026-06-19).
The tooling matrix (06) and external dependency audit (07) should be updated
whenever a package's `package.json` changes significantly.

A future automation script (`scripts/update-diagrams.js`) will regenerate the
version tables from live `package.json` files — see TASK-017 for the plan.
