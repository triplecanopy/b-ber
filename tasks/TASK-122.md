# TASK-122: Pin and dedupe every dependency specifier

**Epic:** Dependency health
**GitHub Issue:** #636 — https://github.com/triplecanopy/b-ber/issues/636
**Scope:** monorepo

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
- [ ] Add `versioning-strategy: increase` to `.github/dependabot.yml` — deferred
      from TASK-123 because it is meaningless until specifiers are exact

## Notes

- Do **not** pin the first-party `@canopycanopycanopy/*` cross-dependencies by hand
  — lerna manages those, and `lerna.json` already sets `command.version.exact`.
- Pinning changes nothing about what is currently installed if done from the
  existing lockfile; verify that by diffing installed versions before and after.
- **Re-sequenced 2026-09-23: this no longer blocks TASK-123.** Only
  `versioning-strategy: increase` needed exact pins, and it moved here — adding it
  to `.github/dependabot.yml` is now a subtask of *this* task, to land with the
  pins. Everything else in the policy (the major-ignore in particular) works against
  caret ranges, so the rules shipped first.
- That makes this task discretionary rather than blocking. Its case stands on its
  own: manifests that state what was actually tested against, and closing the
  `npm install` drift class that produced TASK-115. The cost is a ~388-line diff and
  more PR volume, against a lockfile that already makes `npm ci` reproducible.
- Parent: TASK-121.
