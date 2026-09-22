# TASK-122: Pin and dedupe every dependency specifier

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** (pending)

## Description

**388 of 392 specifiers use `^`.** Pin them all to exact versions so the manifests,
not the resolver, decide what is installed — and so Dependabot's
`versioning-strategy` has something to act on (it cannot meaningfully bump a caret
range).

`syncpack` is already a devDependency (TASK-053) with `npm run deps:dedupe`
(`syncpack lint`) and `deps:dedupe:fix` wired up. It needs a config declaring the
pinned-exact policy.

### The dedupe half is small

Only **3** dependencies disagree across packages:

| Dep | Specs | Decision |
| --- | ----- | -------- |
| `js-yaml` | `^3.12.0`, `^4.1.0` | **needs care** — v4 removed `safeLoad`/`safeDump`; check every call site |
| `@types/js-yaml` | `^3.12.10`, `^4.0.9` | follows whatever `js-yaml` lands on |
| `sass` | `^1.49.8`, `^1.70.0` | same major; take the higher |

Everything else is already consistent, so this is mostly mechanical.

### Why pin, given it means more PRs

Pinning makes every patch bump an explicit, reviewable change instead of something
that varies by install date — which is exactly the class of problem that produced
TASK-115 (a binary present locally, absent after `npm ci`). The extra PR volume is
acceptable *because* Dependabot exists and TASK-123/124 make that volume cheap.

## Subtasks

- [ ] Add a `syncpack` config with a pinned-exact version policy
- [ ] Resolve `sass` and `@types/js-yaml` to their highest in-use version
- [ ] Decide `js-yaml` 3 vs 4; if 4, audit every `safeLoad`/`safeDump` call site
      (`b-ber-lib`'s YamlAdaptor is the likely one) and test a real build
- [ ] Pin all remaining specifiers exactly; `npm install` to refresh the lockfile
- [ ] Full gate: build, `npm test`, `check:circular`, and a real `bber` epub +
      reader build
- [ ] Add `npm run deps:dedupe` to the CI gate so drift cannot reappear silently

## Notes

- Do **not** pin the first-party `@canopycanopycanopy/*` cross-dependencies by hand
  — lerna manages those, and `lerna.json` already sets `command.version.exact`.
- Pinning changes nothing about what is currently installed if done from the
  existing lockfile; verify that by diffing installed versions before and after.
- Parent: TASK-121. Blocks TASK-123 (rules depend on specifiers being exact).
