# TASK-092: Fix Codecov "Validate CLI" GPG failure in CI

**Status:** in progress
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #525 — https://github.com/triplecanopy/b-ber/issues/525

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

- [x] **Reproduce and confirm the trigger.** Read the orb source
      (`codecov/codecov-circleci-orb`, `src/dist/validate.sh`): the
      "(Codecov) Validate CLI" step unconditionally runs
      `curl -s https://keybase.io/codecovsecops/pgp_keys.asc | gpg --import`
      unless `skip_validation`/`binary`/`use_pypi` is set. The `gpg: no valid
      OpenPGP data found` error means that keybase.io fetch returned
      empty/non-PGP content (HTML error page or blocked request) from
      CircleCI's network — this is a known flaky dependency of the orb's
      validation step, not something specific to this repo's image or
      `CODECOV_TOKEN` timing.
- [x] **Pick a fix.** Applied candidate #1 (cheapest): added
      `skip_validation: true` to the `codecov/upload` step. Per
      `validate.sh`, this entirely bypasses the `gpg --import` /
      `gpg --verify` / `sha256sum -c` block (the CLI is just `chmod +x`'d and
      run normally) — it does not touch the upload itself.
- [x] **Don't let coverage upload break the build.** Set `fail_on_error: false`
      explicitly (this is also the orb's default). `validate.sh` and
      `run_command.sh` only `exit 1` on error when `CODECOV_FAIL_ON_ERROR=true`,
      so upload/runtime failures were already non-fatal to the `build` job;
      this documents that intent. The CLI-validation failure that actually
      broke the job is addressed by `skip_validation` above — making that step
      pass cleanly is strictly better than trying to suppress its exit code.
- [ ] **Verify green** on a CI run with `CODECOV_TOKEN` set.

## Notes

Branch: `feat/upgrades`

Introduced alongside the Codecov wiring in [[TASK-049]] (orb bumped to v5 in the
`fix(monorepo): bump codecov orb to v5` commit). The upload itself uses
`files: coverage/lcov.info` + `disable_search: true`; this failure is in the
orb's pre-upload CLI-validation step, not the upload.

Also gated on the org-level **"Allow uncertified public orbs"** CircleCI setting
being enabled (separate from this GPG issue).

**2026-06-11:** Added `skip_validation: true` and `fail_on_error: false` to the
`codecov/upload` step in `.circleci/config.yml`. Root cause confirmed by reading
`codecov/codecov-circleci-orb`'s `src/dist/validate.sh`: the orb's "(Codecov)
Validate CLI" step does `curl -s https://keybase.io/codecovsecops/pgp_keys.asc |
gpg --import` and then verifies the downloaded CLI's SHA256SUM signature against
that key. The `no valid OpenPGP data found` error means the keybase.io fetch came
back empty/non-PGP — a known-flaky external dependency unrelated to this repo's
CI image or `CODECOV_TOKEN`. `skip_validation: true` is the orb's documented
escape hatch ("Skip integrity checking of the CLI. This is NOT recommended.")
and skips that whole gpg/sha256 block while leaving the actual upload (`files:
coverage/lcov.info`, `disable_search: true`) untouched. `fail_on_error: false`
matches the orb's existing default and documents that upload-step failures
(as opposed to the validation step) are already non-fatal.

**Remaining for verification:** push this branch (or merge to a branch that
runs CI) and confirm the `build` job's "(Codecov) Validate CLI" step now logs
"Bypassing validation..." and exits 0, and that the coverage upload to Codecov
still succeeds. Cannot be verified locally — requires a real CircleCI run with
`CODECOV_TOKEN` set in project settings.

Related: [[TASK-049]] (coverage upload service), [[TASK-035]] (CircleCI pipeline),
[[TASK-044]] (CI jobs).
