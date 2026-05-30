# TASK-014: Research and set up GitHub issue tracking integration

**Status:** in progress
**Scope:** monorepo
**Priority:** medium

## Description

The repo is on GitHub (`triplecanopy/b-ber`). Work is currently tracked as
Markdown PRDs in `tasks/` and `packages/*/tasks/`. For external visibility,
issues should also exist in GitHub's issue tracker. The workflow is:

1. Do the work using the Markdown task system (as now)
2. When a task is complete (or retroactively), create a GitHub issue and
   immediately close it — so there is a record in GitHub with full context
3. For in-progress or future tasks, optionally open issues ahead of time

This task researches the lightest-weight way to create and manage GitHub
issues from within this development environment, and sets it up.

## Research Findings

### Repository

`git@github.com:triplecanopy/b-ber.git` — SSH remote, confirmed.

### Option A: `gh` CLI (recommended)

The `gh` CLI is GitHub's official command-line tool. **Installed and authenticated
(SSH + browser OAuth, 2026-05-30).**

```bash
brew install gh
gh auth login   # interactive; supports SSH key, token, or browser OAuth
```

Once authenticated, issue operations are one-liners:

```bash
# Create an issue
gh issue create \
  --title "TASK-006: Migrate b-ber-reader-react to Vite" \
  --body "$(cat tasks/TASK-006.open.md)" \
  --label "enhancement"

# Close an issue with a comment
gh issue close 42 --comment "Completed in commit abc1234."

# List open issues
gh issue list

# View an issue
gh issue view 42
```

`gh` uses the repo's git remote to infer the GitHub repo automatically —
no explicit `--repo` flag needed when running from inside the repo.

**This is the recommended approach.** It requires no credentials in code,
no API tokens stored anywhere, and no new dependencies beyond the CLI itself.
The existing dev environment instruction ("use the gh command via the Bash
tool for ALL GitHub-related tasks") assumes `gh` is installed.

### Option B: GitHub REST API with a PAT

GitHub's REST API at `https://api.github.com` handles issue CRUD via simple
HTTP calls. No GraphQL needed for this use case.

```bash
# Create an issue
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/triplecanopy/b-ber/issues \
  -d '{"title":"TASK-006: ...","body":"...","labels":["enhancement"]}'

# Close an issue
curl -X PATCH \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/triplecanopy/b-ber/issues/42 \
  -d '{"state":"closed"}'
```

**When to use instead of gh:** If `gh` can't be installed (e.g., CI environment
without Homebrew), a PAT stored in an env var is a clean fallback. Generate
a fine-grained PAT at GitHub → Settings → Developer settings → Personal access
tokens → Fine-grained tokens, scoped to `triplecanopy/b-ber` with `Issues: Read and write` permission only.

Note: GitHub does have a GraphQL API at `https://api.github.com/graphql`, but
for creating and closing issues the REST API is simpler — GraphQL adds value
only for complex queries or bulk mutations.

### Option C: GitHub MCP server

The `@modelcontextprotocol/server-github` MCP server exposes GitHub operations
as agent tools. This would allow issue creation/closure without `Bash` tool
calls. However, it requires installing and configuring an MCP server in
`.claude/settings.json`, which is heavier than `gh` CLI for this use case.
Worth considering if more GitHub automation is needed later (e.g., auto-linking
PRs to issues, querying issue metadata during planning).

## Subtasks

- [x] Install `gh` CLI: `brew install gh`
- [x] Authenticate: run `! gh auth login` in the Claude Code session
      (the `!` prefix runs the interactive command in the terminal)
- [x] Verify: `gh issue list` returns existing open issues (confirmed 2026-05-30)
- [ ] Retroactively create and close GitHub issues for all completed root tasks:
  - TASK-001 (webpack replacement research) — closed
  - TASK-002 (JS→TS migration strategy) — closed
  - TASK-003 (type consolidation research) — closed
    Use the task PRD body as the issue description. Add a closing comment
    linking to the relevant commit SHA.
- [ ] Create open GitHub issues for all in-progress or not-started root tasks:
  - TASK-004 (test coverage)
  - TASK-005 (Biome research)
  - TASK-006 through TASK-013 (implementation tasks)
    Label open implementation tasks `enhancement`; label research tasks `research`.
- [ ] Document the issue workflow in this AGENTS.md (update the Task System
      section to reference GitHub issues as the external tracker).
- [ ] Decide: should per-package tasks also get GitHub issues, or only root tasks?
      (Recommendation: root tasks only for now — per-package tasks are too granular
      for external visibility and would flood the issue tracker.)

## Notes

- GitHub's REST API is version-stable and well-documented at
  `https://docs.github.com/en/rest`. The `gh` CLI wraps the same API.
- The PAT approach (Option B) should only be used if `gh auth` can't be
  done interactively. Store the token in an env var (`GITHUB_TOKEN`), never
  in a file.
- Issue titles should follow the format `TASK-NNN: <same title as the PRD>`
  so that searching GitHub issues and searching the `tasks/` directory give
  consistent results.
- Closing message convention: `"Resolved in <commit SHA>. See tasks/TASK-NNN.md."`.
