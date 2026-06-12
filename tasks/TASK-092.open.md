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
- [x] **Pick a fix.** Candidate #1 (`skip_validation: true`) was tried first
      but does NOT work — see 2026-06-12 note below. Applied candidate #2/#4
      instead: pre-download the Codecov CLI in a `run` step and pass it to
      `codecov/upload` via `binary: ./codecov`. Per `validate.sh`, a non-empty
      `CODECOV_BINARY` bypasses the `gpg --import` / `gpg --verify` /
      `sha256sum -c` block entirely (and short-circuits the orb's own
      download), without touching the upload itself.
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

**2026-06-12:** `skip_validation: true` did NOT fix the build (CircleCI build
#389, commit a8862e82 — "(Codecov) Validate CLI" still failed with the same
`gpg: no valid OpenPGP data found` / exit 2). Pulled the step's logs via the
CircleCI v1.1 API: the "(Codecov) Setup Codecov environment variables" step
shows `export CODECOV_SKIP_VALIDATION=1`, but `validate.sh`'s bypass check is
`[ "$CODECOV_SKIP_VALIDATION" == "true" ]` — a literal string comparison to
`"true"`, not `"1"`. CircleCI renders the boolean `skip_validation` parameter
into the step's `environment:` map as `1`/`0`, not `"true"`/`"false"`, so the
bypass condition is never met. This is a bug in
`codecov/codecov-circleci-orb`'s `upload.yml` (boolean param fed into a
string-compared env var). `use_pypi: true` would hit the identical issue
(same `== "true"` pattern).

Switched to the `binary` param instead: added a `run` step that does
`curl -Os https://cli.codecov.io/latest/linux/codecov && chmod +x codecov`
before `codecov/upload`, and set `binary: ./codecov`. `download.sh` and
`validate.sh` both gate on `[ -n "$CODECOV_BINARY" ]` — a plain non-empty
string test, unaffected by the boolean-rendering bug — which both skips the
orb's own re-download and bypasses the gpg/sha256 validation block entirely.
Removed `skip_validation: true` (dead/misleading now); kept
`fail_on_error: false`.

**Remaining for verification:** push this branch and confirm the `build` job's
"(Codecov) Validate CLI" step now logs "Bypassing validation..." and exits 0,
and that the coverage upload to Codecov still succeeds. Cannot be verified
locally — requires a real CircleCI run with `CODECOV_TOKEN` set in project
settings.

Related: [[TASK-049]] (coverage upload service), [[TASK-035]] (CircleCI pipeline),
[[TASK-044]] (CI jobs).
