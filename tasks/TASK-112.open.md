# TASK-112: Reconcile the lerna release workflow with the "require PR" ruleset on `main`

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**Branch:** `feat/deploy`
**Related:** [[TASK-045]] (changelog + release-workflow refactor) — this task is
the narrower, blocking half: getting a version/tag push to land at all under the
new branch rule. Fold the outcome back into TASK-045's release sequencing.

## Description

A GitHub branch rule — **"all pushes must be made through a pull request"** — was
enabled on `main`. Publishing a new package version now fails: `lerna publish`
aborts when it tries to push, with:

```
remote: - Changes must be made through a pull request.
```

### Root cause (the error message is misleading)

The failing push is **not** the tags. `lerna publish` (`npm run publish:latest`)
runs a `lerna version` step that:

1. bumps versions and creates a **commit** on the current branch (message `%v`,
   per `lerna.json` → `command.publish.message`),
2. creates the git **tags**, then
3. pushes **both the commit and the tags** to `origin`.

The rule governs branch refs (`refs/heads/main`), so what's rejected is the
**version-bump commit landing directly on `main`**. Tags (`refs/tags/*`) are not
covered by a "require a pull request" rule at all. So the fix is about how that
commit reaches `main` under the rule, not about "allowing tags."

Current release entry points (root `package.json`):

- `publish:latest` → `lerna publish`
- `publish:canary` → `lerna publish --canary`
- `publish:lts-2` → guarded `lerna publish --dist-tag lts-2` (lts-2 branch only)
- `postpublish` → `node scripts/run-ci.js`
- `lerna.json`: fixed version `4.0.0`, `publish.message: "%v"`, `version.exact: true`

## Goal

Keep the "require PR" rule enforced on `main` while restoring a working publish
flow — ideally one where **no human needs direct push access to `main`**.

## Options to evaluate

Ordered roughly by increasing robustness. Decide with the user before building.

### Option 1 — Bypass actor (fastest; keeps rule, exempts the release identity)
If this is a **repository ruleset** (Settings → Rules → Rulesets), add the release
identity to the **Bypass list**. If it's **classic branch protection**, the
equivalent is "Allow specified actors to bypass required pull requests."
- Prefer exempting a **CI app / bot**, not a personal account.
- Pro: zero workflow change. Con: a standing carve-out on `main`.
- First step: determine which mechanism is in place —
  `gh api repos/triplecanopy/b-ber/rulesets` and
  `gh api repos/triplecanopy/b-ber/branches/main/protection`.

### Option 2 — Don't push the version commit to `main`
Change the flow so lerna never pushes directly to a protected branch:
- `lerna version --no-push`, push **tags only** (`git push origin --tags`), and
  land the version-bump commit via a normal PR; or
- run releases from an **unprotected release branch**, then PR into `main`.

### Option 3 — Tag-driven CI publish (recommended long-term)
A GitHub Actions release workflow triggered on tag push that runs
`lerna publish from-git` (or `from-package`). Humans push a tag; CI publishes.
Combine with Option 1's bypass for the CI app so the release identity — and only
it — can push the version commit + tags. Removes human direct-push to `main`
entirely and makes releases reproducible.

## Acceptance criteria

- [ ] Determined whether `main` is protected by a **ruleset** or **classic branch
      protection**, and documented which (with the exact rule name).
- [ ] Chosen an option **with the user** and recorded the decision + rationale in
      this file's Notes.
- [ ] A version can be published end-to-end without disabling or weakening the
      "require PR" rule for normal contributors.
- [ ] The `publish:*` scripts (and `postpublish`/`run-ci.js` if touched) reflect
      the chosen flow; any bypass actor is a bot/app, not a personal account.
- [ ] Release steps documented (README or `docs/`) so the sequence isn't tribal
      knowledge — coordinate with [[TASK-045]] so the two don't diverge.
- [ ] `lts-2` / `canary` publish paths still work (or are explicitly out of scope).

## Notes

- `git remote`: `git@github.com:triplecanopy/b-ber.git`.
- Do not force-push to `main` (AGENTS.md Branch Strategy).
- The bypass-actor and tag-driven-CI options are complementary, not exclusive.
