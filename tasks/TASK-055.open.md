# TASK-055: Create testing skill once E2E setup is defined

**Status:** not started
**Feature:** E2E testing
**Scope:** monorepo
**Priority:** low
**GitHub Issue:** (add after creating the issue)

## Description

Once TASK-040 (E2E testing research) concludes, there will be enough procedural
content to warrant a `.claude/skills/testing.md` skill. The skill does not exist
yet because the content doesn't — unit test conventions are already covered by
AGENTS.md's Quality Gates section, and the E2E commands, fixture setup, and
browser test workflow are unknown until TASK-040 defines them.

This task is a placeholder to ensure the skill gets created at the right time
rather than forgotten.

## Subtasks

- [ ] TASK-040 complete (E2E tooling + fixture design decided)
- [ ] Read TASK-040 deliverables and identify the procedural content that should
      become skill steps (commands per test type, fixture startup, browser targets)
- [ ] Draft `.claude/skills/testing.md` using `/skill-creator`
- [ ] Add pointer in AGENTS.md Quality Gates section to the new skill
- [ ] Commit and verify the skill is tracked by git

## Notes

Blocked on: TASK-040

Do not start this task until TASK-040 is marked complete. The skill should cover:
- Which commands to run for unit vs. integration vs. E2E tests
- How to start the test fixture project (defined in TASK-041)
- Which packages require real-filesystem tests vs. mocked tests
- Any environment variables or external services needed for browser tests

If the E2E setup turns out to be simple enough that a skill adds no value over
the AGENTS.md Quality Gates section, close this task without creating the skill
and document why in the Notes.
