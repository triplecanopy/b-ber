import fs from 'node:fs'
import path from 'node:path'
import { assertBberBuilt, runBber } from '../cli/helpers'

const FIXTURE_DIR = path.join(__dirname, '../../fixtures/kitchen-sink')
const READER_BUILD = path.join(FIXTURE_DIR, '_builds-reader')

// Rebuild the reader fixture on every run. A leftover build from an earlier
// checkout would have the browser tests exercising old output: after a
// dependency upgrade, the build is exactly what changed. It takes under a
// second.
export default async function globalSetup() {
  assertBberBuilt()
  fs.rmSync(READER_BUILD, { recursive: true, force: true })

  const result = runBber(['build', 'reader'], FIXTURE_DIR, 120_000)

  if (result.status !== 0) {
    throw new Error(
      `bber build reader failed (exit ${result.status}):\n${result.stderr}`
    )
  }
}
