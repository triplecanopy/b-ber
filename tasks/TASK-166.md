# TASK-166: Build targets concurrently with staging and rename

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #829 — https://github.com/triplecanopy/b-ber/issues/829
**Scope:** b-ber-tasks, b-ber-cli, b-ber-parser-footnotes

## Description

Plan step 4 of [TASK-160](./TASK-160.md): prepare once, then fan out.

- **Default concurrency:** every requested target at once, capped at
  `os.availableParallelism()`. `--concurrency=N` is a CLI flag only, not a
  config key; `--concurrency=1` runs one at a time.
- **A failing target doesn't stop the others.** Each started target runs to
  the end, each result is reported, and the exit code is 1 if any failed.
- **Staging:** each target builds in a staging directory and is renamed into
  place on success, on today's paths. The move under `<dist>/<target>/` is
  TASK-169, in 5.0.
- **Prepare:** cover generation runs once, before the fan-out.

**Prerequisite: the footnote `Counter`.** `parser-footnotes` keeps one
module-level counter. Under `group_footnotes: false` it numbers notes across
the whole book, and concurrent targets advance it for each other (the spike:
notes `10, 11` instead of `4, 5`). Five published books in the GitLab group
set `false`, so the counter moves onto the context before targets run
concurrently.

## Subtasks

- [ ] Move the footnote `Counter` onto the build context, one per target
- [ ] Give the kitchen-sink fixture footnotes in several documents, under `book` numbering. It has one footnote today, so nothing would catch the leak
- [ ] A concurrency test modelled on the spike: render every target at once, compare each with its serial output (normalising random footnote ids), with a no-shim negative control that must fail
- [ ] Prepare (cover generation) and fan-out under `--concurrency`, with the failure policy above
- [ ] Staging and rename on today's paths
- [ ] Fan out only targets whose tasks have all migrated (TASK-165)

## Notes

- Design: [TASK-160](./TASK-160.md), "Running a build: plan, prepare, fan out" and
  "Concurrency, failures and the logger"; Findings, "spike" and "where a
  build's time goes".
- Depends on TASK-165. The logger side is TASK-167.
