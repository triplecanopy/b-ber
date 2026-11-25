# TASK-179: Consolidate the directive packages into one

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #842 — https://github.com/triplecanopy/b-ber/issues/842
**Scope:** grammar packages, parser packages, b-ber-markdown-renderer, b-ber-shapes-directives

## Description

Plan step 6 of [TASK-161](./TASK-161.md), the 5.0 major together with TASK-173.

The grammar, parser, renderer and shape packages become one package (working
name `b-ber-markdown`): the 15 `grammar-*` packages (16 until TASK-145
retired `grammar-epigraph`), the 5 `parser-*`, `b-ber-markdown-renderer` and
`b-ber-shapes-directives`. The parse is importable without the render half
(for example a `/parse` subpath), because `b-ber-validator` depends on it
alone.

## Subtasks

- [ ] The consolidated package, with a parse-only entry point
- [ ] `b-ber-tasks` and `b-ber-validator` depend on it
- [ ] A final release of each old package that `npm deprecate`s it, pointing at the new one
- [ ] Update AGENTS.md's package inventory and the diagrams

## Notes

- Design: [TASK-161](./TASK-161.md), "Package consolidation".
- Depends on TASK-176, TASK-177 and TASK-178. Merge only once 5.0 is the next
  release.
