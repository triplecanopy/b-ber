# TASK-012: Source code subdirectory documentation

**Status:** not started
**Phase:** Documentation
**Priority:** low

## Description

Add README files to each major source subdirectory so that future agents and
contributors have inline context about what each module does, what it exports,
and how it interacts with the rest of the codebase.

This task should be done by subagents in parallel — one per directory.

## Subtasks

- [ ] `src/components/README.md` — component inventory, responsibility of each component, HOC chain diagram
- [ ] `src/components/Reader/README.md` — Reader orchestrator, `selfRef` pattern, navigation/loader/resize module relationships
- [ ] `src/components/Media/README.md` — media component hierarchy (Audio, Video, Vimeo, Iframe)
- [ ] `src/components/Navigation/README.md` — NavigationHeader, NavigationFooter, Icon
- [ ] `src/components/Sidebar/README.md` — sidebar tabs and their data sources
- [ ] `src/lib/README.md` — HOCs (`withDimensions`, `withLastSpreadIndex`, `withNodePosition`, `withIframePosition`), contexts, utilities
- [ ] `src/helpers/README.md` — helper function inventory (Asset, Cache, DOM, Request, Storage, Url, Viewport, XMLAdaptor, utils)
- [ ] `src/models/README.md` — data model classes (SpineItem, GuideItem, BookMetadata, ViewerSettings, etc.)
- [ ] `src/actions/README.md` — Redux action creators and their shape
- [ ] `src/reducers/README.md` — Redux state shape and reducer responsibilities
- [ ] `src/hooks/README.md` — existing custom hooks
- [ ] Update `PLAN.md`

## Notes

- Subagents should read the actual source files before writing documentation.
- READMEs should describe the current state of the code, not aspirational architecture.
- Keep READMEs concise: a component list with one-line descriptions is better than
  paragraphs that will go stale.
