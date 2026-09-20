# TASK-116: Move releases to OIDC trusted publishing (requires lerna 9+)

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #593 — https://github.com/triplecanopy/b-ber/issues/593

## Description

TASK-115 automated releases but still authenticates to npm with an `NPM_TOKEN`
secret. That token path is on a clock:

- **Granular tokens with write access are capped at 90 days.** Every expiry breaks
  `release-publish.yml`, on a path nobody touches between releases — so it fails at
  the worst possible moment.
- **Direct publishing with "Bypass 2FA" tokens is deprecated, with removal planned
  for January 2027.** Unattended CI publishing requires that bypass, so the token
  approach has a hard end date roughly one or two rotations away.

npm's replacement is **trusted publishing**: OIDC between GitHub Actions and the
registry, no long-lived credential, and provenance attestations for free.

### The blocker

**Lerna added OIDC trusted publishing in v9.0.0. This repo is on 8.2.4** (latest
is 10.0.1). Lerna 8 publishes through `libnpmpublish` and has no OIDC path, so no
amount of npm-side configuration will make it work. Upgrading lerna is the
substance of this task; the npm-side setup is comparatively easy.

### What is already known (do not re-research)

Established while setting up TASK-115, on 2026-09-20:

- `npm trust github <pkg> --file <workflow>.yml --repo owner/repo --yes` configures
  a GitHub Actions trusted publisher. Verified present in the npm CLI installed
  here (11.11.0); `--dry-run` previews. Note the published docs show
  `--allow-publish`/`--allow-stage-publish` flags that this npm version does not
  accept — check `npm trust github --help` against whatever npm is current when
  this is picked up.
- Configuration is **per package**, with no scope or org level. There are **36
  publishable packages** here. Bulk configuration went GA 2026-02-18; roughly 80
  packages fit inside npm's 5-minute 2FA skip window, so one scripted pass with a
  ~2s sleep between calls covers all 36. Account-level 2FA is required.
- Each package supports up to 10 trusted publishers, so a trusted publisher can be
  added *alongside* the existing token and verified before the token is revoked.
  npm explicitly recommends that order.
- Requirements: npm CLI ≥ 11.5.1, Node ≥ 22.14.0, and `id-token: write` in the
  publishing workflow. The repo already uses Node 24 / npm 11.
- Official reference: https://github.com/JamesHenry/lerna-v9-oidc-publishing-example
- npm's own docs: https://docs.npmjs.com/trusted-publishers/ and
  https://docs.npmjs.com/cli/v11/commands/npm-trust/

The bulk `npm trust` script is deliberately **not** written yet — it is useless
until lerna can actually publish over OIDC, and the flags may shift before then.

## Subtasks

- [ ] Upgrade lerna 8.2.4 → 9.x or 10.x; read both majors' changelogs and check
      what breaks (`lerna version`/`publish` options, `lerna run` behaviour, the
      staged build in `.circleci/config.yml`, the root `lerna` script)
- [ ] `npm test` and a full `npm run build` green on the upgrade alone, before any
      OIDC work
- [ ] Add `id-token: write` to `release-publish.yml`'s permissions
- [ ] Script the `npm trust github` pass over all 36 publishable packages
      (`--dry-run` first)
- [ ] Release once with **both** the trusted publisher and `NPM_TOKEN` in place, to
      confirm OIDC is the path actually used
- [ ] Remove the `NPM_TOKEN` secret and its `NODE_AUTH_TOKEN` wiring from
      `release-publish.yml`
- [ ] Confirm provenance attestations appear on the published packages
- [ ] Update AGENTS.md § Releases: drop the token setup, document the trusted
      publisher and how to add one for a **new** package (a package added later
      will not publish until it has its own trusted publisher — a trap worth
      writing down)

## Notes

- **Why high priority despite nothing being broken today:** the deadline is
  external and fixed. The 90-day rotation starts biting within one quarter, and
  January 2027 removes the bypass-2FA publish path entirely. Doing this under
  deadline, alongside a lerna major upgrade, is worse than doing it now.
- If the lerna upgrade turns out to be a long haul, npm's **stage-only tokens** are
  an interim option: CI stages a release and a human promotes it. That keeps
  publishing possible past January 2027 without the bypass, and without waiting on
  lerna. Worth pricing if this task stalls.
- A new package added to the monorepo will silently fail to publish until it has a
  trusted publisher configured. Whatever gets written in AGENTS.md should cover
  that, and `## Adding AGENTS.md to a New Package` may need a pointer.
- Depends on TASK-115 (the workflows themselves). Related: TASK-045 (release and
  changelog refinement).
