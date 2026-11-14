# TASK-143: Automate the dependency impact report

**Epic:** Dependency health
**GitHub Issue:** #714 — https://github.com/triplecanopy/b-ber/issues/714
**Scope:** monorepo

## Description

Split from TASK-132, whose policy half shipped
([`docs/dependency-update-policy.md`](../docs/dependency-update-policy.md)).
This is the half that was never built: a report on every PR that crosses a
major, saying where the dependency is used and how far to trust the tests, plus
a typecheck that ignores errors already on `main`.

The design is TASK-132's, unchanged. Read its **Design** and **Feasibility**
sections. In short, the `dependency-impact.yml` workflow does four things on any
PR that changes a `package.json`:

1. **Detect.** It diffs the manifests to find direct dependencies that cross a
   major or a 0.x minor.
2. **Report.** `scripts/dep-impact.js` lists:
   - import sites, with symbols and call expressions;
   - related Jest tests, flagging those that mock the dependency;
   - the surfaces reached;
   - a reviewer checklist.

   This goes out as one sticky PR comment, plus the job summary.

3. **Typecheck diff.** Base against head, failing on new errors only.
4. **Smoke.** Links to the existing `e2e` job.

### What three manual runs showed a reviewer needs

TASK-139 (image-size), TASK-140 (js-yaml) and TASK-141 (postcss) ran the
policy's checklist by hand. Three findings change the design:

- **The other copies of the dependency.** In two of the three, the PR as
  proposed would not have fixed the real path. `yawn-yaml` carries its own
  js-yaml 3, which parses `config.yml`. `autoprefixer@9` depends on `postcss ^7`
  itself, so Renovate's postcss-only PR left postcss 7 inside the theme
  pipeline. The report should list every installed copy of the dependency from
  the head lockfile, with the package that requires each, and flag any copy
  still in the vulnerable range. `npm ls <dep>` and npm audit's `nodes` give
  this.
- **Mocked tests, confirmed.** TASK-139's image-size was mocked in the tests of
  both packages that import it. The mock flag in the design is right; keep it.
- **Output comparison is the real check, and it is per dependency.** Each task
  proved "no behaviour change" by building before and after and diffing:
  - kitchen-sink scenarios, normalized;
  - for js-yaml, a value-by-value corpus;
  - for postcss, the CSS captured from postcss inside the real CLI.

  That does not generalise into one job. What the report can do is point at
  the reusable piece, the TASK-140 scenario script (`new`, `theme set`,
  `generate`, builds), as a candidate e2e job that compares a PR's output with
  its base. Decide here whether to build that or leave it as a manual step in
  the policy.

## Subtasks

- [ ] `scripts/dep-impact.js`: manifest diff → majors/0.x minors → import sites
      with symbols and call sites → related tests (+ mock flag) → surfaces → every
      installed copy of the dependency and who requires it → Markdown
- [ ] Unit tests for the detection rules (major, 0.x minor, range forms like
      `^`/`~`/exact, added and removed deps)
- [ ] `dependency-impact.yml`: run the script, post or update a sticky comment,
      write the job summary
- [ ] Typecheck diff (base vs head, new errors only) as a job in the same
      workflow
- [ ] Decide on a base-vs-head output comparison job (the TASK-140 scenarios)
- [ ] Try it on the next breaking `[security]` PR (`markdown-it` #699) and refine
      the output against what the reviewer needed
- [ ] Update the policy's "What exists today" table as pieces land

## Notes

- Split from TASK-132 on 2026-11-06. Related: TASK-139, TASK-140 and TASK-141
  (manual runs), TASK-119 (typecheck on `main`; retire the diff once it is
  green), TASK-130 (the e2e job this links to).
- **Cancelled 2026-11-13, not built.** The workflow, script, tests and sticky
  comment cost more to build and keep working than they save. Majors arrive a
  few times a year, and four manual runs (TASK-139, 140, 141, 144) took minutes
  each with the checklist. The typecheck diff was moot anyway: TASK-119 made
  `npm run typecheck` green on `main` and a step of the required
  `build-and-test` job, so a plain typecheck already fails on new errors. What
  these runs learned went into the manual checklist in
  `docs/dependency-update-policy.md`: list every installed copy of the
  dependency, and compare build output before and after.
