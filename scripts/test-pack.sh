#!/usr/bin/env bash
# scripts/test-pack.sh — Smoke-test the installed, published b-ber artifacts
# without touching the real npm registry.
#
# Strategy: build all packages, `npm pack --workspaces` all of them into a
# staging dir, then install the full set into a throwaway consumer project.
# When ALL first-party tarballs are listed together in a single `npm install`
# invocation, npm resolves inter-package scoped deps to the local tarballs
# (verified empirically: package-lock.json shows `file:` refs, not npmjs.org
# URLs). No registry server needed.
#
# Usage:
#   ./scripts/test-pack.sh             # full run: build + pack + install + smoke
#   ./scripts/test-pack.sh --no-build  # skip build (use existing dist/)
#   ./scripts/test-pack.sh --no-pack   # skip pack (reuse existing staging dir)
#
# Environment:
#   PACK_STAGING   — override the staging dir (default: /tmp/bber-pack-staging)
#   CONSUMER_DIR   — override the consumer install dir (default: /tmp/bber-consumer)
#
# Exit codes: 0 = all smoke tests passed; non-zero = failure (stderr has details)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACK_STAGING="${PACK_STAGING:-/tmp/bber-pack-staging}"
CONSUMER_DIR="${CONSUMER_DIR:-/tmp/bber-consumer}"

NO_BUILD=0
NO_PACK=0

for arg in "$@"; do
  case "$arg" in
    --no-build) NO_BUILD=1 ;;
    --no-pack)  NO_PACK=1  ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

# ── 1. Build ──────────────────────────────────────────────────────────────────
if [[ $NO_BUILD -eq 0 ]]; then
  echo "[test-pack] Building all packages..."
  (cd "$REPO_ROOT" && npm run build)
else
  echo "[test-pack] Skipping build (--no-build)"
fi

# ── 2. Pack ───────────────────────────────────────────────────────────────────
# npm pack --workspaces requires running from the repo root so npm can discover
# the workspace members. Using --prefix causes "No workspaces found!" with npm 11.
if [[ $NO_PACK -eq 0 ]]; then
  echo "[test-pack] Packing all workspaces → $PACK_STAGING"
  rm -rf "$PACK_STAGING"
  mkdir -p "$PACK_STAGING"
  # --workspaces packs every workspace (including private ones — see note below).
  # Private packages like b-ber-testing get packed too; that is harmless for the
  # smoke test since the extra tarball just installs alongside the publishable ones.
  (cd "$REPO_ROOT" && npm pack --workspaces \
    --pack-destination "$PACK_STAGING" \
    --loglevel warn)
else
  echo "[test-pack] Skipping pack (--no-pack), using existing $PACK_STAGING"
fi

TARBALLS=("$PACK_STAGING"/*.tgz)
if [[ ${#TARBALLS[@]} -eq 0 ]]; then
  echo "[test-pack] No tarballs found in $PACK_STAGING — did the pack step run?" >&2
  exit 1
fi
echo "[test-pack] Found ${#TARBALLS[@]} tarballs"

# ── 3. Install into throwaway consumer project ────────────────────────────────
echo "[test-pack] Installing all tarballs into $CONSUMER_DIR..."
rm -rf "$CONSUMER_DIR"
mkdir -p "$CONSUMER_DIR"
printf '{"name":"bber-smoke-test","version":"1.0.0","private":true}\n' \
  > "$CONSUMER_DIR/package.json"

# Install ALL tarballs together in one invocation. This is the critical step:
# npm resolves inter-package scoped deps to the local tarballs when they are
# all present as siblings in the same install command.
#
# Installing only the CLI tarball would cause npm to fall back to the real
# registry for every first-party transitive dep (@canopycanopycanopy/*).
# Verified empirically: with all tarballs, package-lock.json shows only
# `file:` resolved entries for @canopycanopycanopy packages.
(cd "$CONSUMER_DIR" && npm install "${TARBALLS[@]}" \
  --prefer-offline \
  --loglevel warn)

BBER="$CONSUMER_DIR/node_modules/.bin/bber"
if [[ ! -x "$BBER" ]]; then
  echo "[test-pack] bber binary not found at $BBER" >&2
  exit 1
fi

# ── 4. Smoke tests ────────────────────────────────────────────────────────────
echo "[test-pack] Running smoke tests from a non-project directory..."

# (a) bber --version must print a semver without reading project files.
#     The canary bug: eager State init triggered ENOENT on _project/toc.yml
#     when run from any directory that isn't a b-ber project.
VERSION_OUT=$(cd /tmp && "$BBER" --version 2>&1)
if ! echo "$VERSION_OUT" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+'; then
  echo "[test-pack] FAIL: bber --version output did not match semver: '$VERSION_OUT'" >&2
  exit 1
fi
echo "[test-pack] PASS: bber --version → $VERSION_OUT"

# (b) bber --help must exit 0 (exercises yargs command loading without a project).
if ! (cd /tmp && "$BBER" --help > /dev/null 2>&1); then
  echo "[test-pack] FAIL: bber --help exited non-zero" >&2
  exit 1
fi
echo "[test-pack] PASS: bber --help exited 0"

# (c) Verify first-party deps resolved locally, not from the real registry.
#     Informational: does not fail the script, but logs a warning if any
#     @canopycanopycanopy package resolved from npmjs.org. The one expected
#     exception is b-ber-theme-mixins, which is a legacy package on the real
#     registry that is not in this monorepo.
REGISTRY_HITS=$(node -e "
  const lock = require('$CONSUMER_DIR/package-lock.json');
  const pkgs = Object.values(lock.packages || {});
  const hits = pkgs.filter(p =>
    p.resolved &&
    p.resolved.includes('npmjs.org') &&
    p.resolved.includes('canopycanopycanopy') &&
    !p.resolved.includes('b-ber-theme-mixins')
  );
  console.log(hits.length);
")
if [[ "$REGISTRY_HITS" -gt 0 ]]; then
  echo "[test-pack] WARNING: $REGISTRY_HITS unexpected first-party package(s) resolved from real registry" >&2
  node -e "
    const lock = require('$CONSUMER_DIR/package-lock.json');
    const pkgs = Object.entries(lock.packages || {});
    const hits = pkgs.filter(([,v]) =>
      v.resolved && v.resolved.includes('npmjs.org') && v.resolved.includes('canopycanopycanopy') && !v.resolved.includes('b-ber-theme-mixins')
    );
    hits.forEach(([k]) => console.error('  REGISTRY:', k));
  " >&2
else
  echo "[test-pack] PASS: all first-party packages resolved locally (b-ber-theme-mixins excepted)"
fi

echo "[test-pack] All smoke tests passed."
