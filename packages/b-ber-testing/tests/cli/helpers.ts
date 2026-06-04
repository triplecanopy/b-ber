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

// Strip workspace node_modules/.bin from PATH so that spawnSync('bber', ...)
// resolves to the globally installed binary, not the workspace symlink (which
// requires a full monorepo dev-build to work).
function globalPath(): string {
  return (process.env.PATH ?? '')
    .split(':')
    .filter((p) => !p.endsWith('node_modules/.bin'))
    .join(':')
}

export function runBber(args: string[], cwd: string): SpawnSyncReturns<string> {
  return spawnSync('bber', args, {
    cwd,
    encoding: 'utf8',
    timeout: 90_000,
    env: { ...process.env, PATH: globalPath() },
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
