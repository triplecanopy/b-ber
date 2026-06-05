import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const FIXTURE_DIR = path.join(__dirname, '../../fixtures/kitchen-sink')
const MANIFEST_PATH = path.join(FIXTURE_DIR, '_builds-reader/manifest.json')

function globalPath(): string {
  return (process.env.PATH ?? '')
    .split(':')
    .filter((p) => !p.endsWith('node_modules/.bin'))
    .join(':')
}

export default async function globalSetup() {
  if (fs.existsSync(MANIFEST_PATH)) return

  const result = spawnSync('bber', ['build', 'reader'], {
    cwd: FIXTURE_DIR,
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, PATH: globalPath() },
  })

  if (result.status !== 0) {
    throw new Error(
      `bber build reader failed (exit ${result.status}):\n${result.stderr}`
    )
  }
}
