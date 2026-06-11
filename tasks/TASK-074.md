# TASK-074: Document local development setup for agents

**Status:** complete
**Feature:** React 19 (reader-react)
**Phase:** Documentation
**Created:** 2026-05-30
**GitHub Issue:** #470 — https://github.com/triplecanopy/b-ber/issues/470

## Description

Document how to run the reader locally so that agents can start the dev server,
load specific projects, and visually verify changes without manual setup.

## Subtasks

- [x] Read `dev/index.js`, `dev/index.example.js`, `dev/index.ejs`, `scripts/start.sh`
- [x] Update `AGENTS.md` dev environment section with `manifestURL` and project list
- [x] Update `PLAN.md`

## Notes

- `dev/index.js` is gitignored — each developer maintains their own copy.
- Content lives on AWS S3; the reader fetches it at runtime via `manifestURL`.
- See `AGENTS.md` "Dev Environment" section for the complete setup guide.
