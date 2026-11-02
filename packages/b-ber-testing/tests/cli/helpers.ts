import { type SpawnSyncReturns, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test as base, expect } from '@playwright/test'

export const FIXTURE_DIR = path.join(__dirname, '../../fixtures/kitchen-sink')
export const FIXTURE_SLUG = 'kitchen-sink-b-ber-fixture-001'
export const EPUB_FILENAME = `${FIXTURE_SLUG}.epub`

function copyDirSync(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const dstPath = path.join(dst, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, dstPath)
    } else {
      fs.copyFileSync(srcPath, dstPath)
    }
  }
}

// The CLI under test is this checkout's own build, run with `node`, never
// whatever `bber` is on PATH. A global install is whichever version someone
// last installed, so a pass against it says nothing about the code in the
// branch. That made the suite useless for verifying a dependency upgrade
// (TASK-130). It also replaces the old workaround of stripping
// node_modules/.bin, which existed because npm does not create the workspace
// `bber` link when dist/ is missing at install time.
//
// Set BBER_BIN to a CLI entry script to test a different build.
export const BBER_BIN =
  process.env.BBER_BIN ??
  path.resolve(__dirname, '../../../b-ber-cli/dist/index.js')

export function assertBberBuilt(): void {
  if (!fs.existsSync(BBER_BIN)) {
    throw new Error(
      `No b-ber CLI build at ${BBER_BIN}. Run \`npm run build\` at the repo root first, or set BBER_BIN.`
    )
  }
}

export function runBber(
  args: string[],
  cwd: string,
  timeout = 90_000
): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [BBER_BIN, ...args], {
    cwd,
    encoding: 'utf8',
    timeout,
  })
}

export function isInPath(tool: string): boolean {
  const result = spawnSync(
    process.platform === 'win32' ? 'where' : 'which',
    [tool],
    { encoding: 'utf8' }
  )
  return result.status === 0
}

type TestFixtures = {
  tmpDir: string
  fixtureCopy: string
}

export const test = base.extend<TestFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture API requires object destructuring
  tmpDir: async ({}, use) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bber-cli-test-'))
    await use(dir)
    fs.rmSync(dir, { recursive: true, force: true })
  },

  fixtureCopy: async ({ tmpDir }, use) => {
    copyDirSync(FIXTURE_DIR, tmpDir)
    await use(tmpDir)
  },
})

export { expect }
