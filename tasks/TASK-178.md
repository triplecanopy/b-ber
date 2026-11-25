# TASK-178: Run bber check on the shared parse and thin b-ber-validator to a reporter

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #841 — https://github.com/triplecanopy/b-ber/issues/841
**Scope:** b-ber-validator, b-ber-tasks

## Description

Plan step 5 of [TASK-161](./TASK-161.md).

`b-ber-validator` stays a separate package, as a thin layer over the shared
parse. Its parser-combinator grammar is deleted: `validator.ts`,
`combinators/` and its own directive name list. What remains is `report` and
a `check(source, fileName)` that runs the shared parse and returns
`env.diagnostics`. One grammar decides what is valid, so the build and
`bber check` cannot disagree (#797).

`bber check --strict` fails on warnings, for CI.

## Subtasks

- [ ] `check()` over the shared parse; `report` formats spans per the spec
- [ ] Delete the combinators and `validator.ts`; move its tests to the parse's diagnostics
- [ ] Flip #797's defect test in `b-ber-tasks/__tests__/validate.test.js`
- [ ] `--strict`
- [ ] Agreement test: `bber check` and the build report the same diagnostics

## Notes

- Design: [TASK-161](./TASK-161.md), "`bber check` uses the same grammar" and "Diagnostics".
- Depends on TASK-175.
