# TASK-092: Fix Codecov "Validate CLI" GPG failure in CI

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** (add after running /sync-task-issues)

## Description

The CircleCI `build` job fails at the **(Codecov) Validate CLI** step (added by
the `codecov/codecov@5` orb in `.circleci/config.yml`). The step tries to verify
the integrity of the downloaded Codecov CLI by importing Codecov's PGP public
key and checking the binary's signature, and the key import comes back empty:

```
gpg: directory '/home/circleci/.gnupg' created
gpg: keybox '/home/circleci/.gnupg/pubring.kbx' created
gpg: no valid OpenPGP data found.
gpg: Total number processed: 0

Exited with code exit status 2
```

`no valid OpenPGP data found` means the orb fetched something that was not a PGP
key (empty body, an HTML error page, or a failed network/keyserver request), so
the subsequent signature validation has no key to validate against and the step
exits non-zero — turning the whole job red even though tests passed.

## Subtasks

- [ ] **Reproduce and confirm the trigger.** Determine whether this started
      before or after `CODECOV_TOKEN` was set, and whether it's intermittent
      (keyserver flakiness) or deterministic (the CI image lacks `gnupg`/`curl`,
      or the key URL the orb uses is unreachable from CircleCI).
- [ ] **Pick a fix.** Candidate approaches, cheapest first:
  - Disable the orb's CLI integrity validation if v5 exposes a param for it
    (e.g. a `validate`/`gpg`-style flag), keeping the upload.
  - Pin the Codecov uploader/CLI version the orb downloads so it doesn't
    re-fetch a key each run.
  - Ensure `gnupg` + `curl` are present in the `cimg/node:24.x` image (they
    normally are) and add a retry around the key import.
  - As a fallback, replace the orb step with a direct Codecov CLI/bash upload
    invocation that skips GPG validation.
- [ ] **Don't let coverage upload break the build.** Whatever the fix, make the
      Codecov step non-fatal to the `build` job (coverage reporting is
      informational — a failed upload should warn, not fail CI). Consider the
      orb's failure-handling param or `when: always` semantics.
- [ ] **Verify green** on a CI run with `CODECOV_TOKEN` set.

## Notes

Branch: `feat/upgrades`

Introduced alongside the Codecov wiring in [[TASK-049]] (orb bumped to v5 in the
`fix(monorepo): bump codecov orb to v5` commit). The upload itself uses
`files: coverage/lcov.info` + `disable_search: true`; this failure is in the
orb's pre-upload CLI-validation step, not the upload.

Also gated on the org-level **"Allow uncertified public orbs"** CircleCI setting
being enabled (separate from this GPG issue).

Related: [[TASK-049]] (coverage upload service), [[TASK-035]] (CircleCI pipeline),
[[TASK-044]] (CI jobs).
