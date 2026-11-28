// Golden-output test (TASK-152): builds the kitchen-sink fixture in each
// deterministic format with this checkout's CLI and compares the normalized
// output with the snapshot in `__golden__/`. A change that alters any output
// fails here and names the file and line.
//
// To accept a change, regenerate the snapshot and review its diff in the PR:
//
//   npx playwright test --project=cli golden --update-snapshots
//
// Playwright does not delete snapshots of files a build no longer writes.
// FILES.txt records the removal; delete `__golden__/<format>/` first to drop
// the stale copies.

import fs from 'node:fs'
import path from 'node:path'
import {
  createNormalizer,
  isReaderAppAsset,
  isText,
  sha256,
} from './golden/normalize'
import { expect, runBber, test } from './helpers'

// mobi and pdf need Calibre and wkhtmltopdf, which CI does not have
const FORMATS = ['epub', 'web', 'reader', 'sample', 'xml'] as const

// Output a format writes to the project root rather than its build directory:
// xml's document, `<identifier>.xml`. Its snapshot is under `<format>/_root/`
const packagedFiles = (format: (typeof FORMATS)[number], root: string) =>
  format === 'xml'
    ? fs.readdirSync(root).filter((name) => name.endsWith('.xml'))
    : []

const listFiles = (dir: string, prefix = ''): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      return entry.isDirectory()
        ? listFiles(path.join(dir, entry.name), rel)
        : [rel]
    })
    // Sorted, so the normalizer numbers random ids in the same order each run
    .sort()

for (const format of FORMATS) {
  test(`bber build ${format} matches the golden output`, ({ fixtureCopy }) => {
    // One timezone and locale everywhere: metadata dates are written with
    // Date#toString(), which gives the machine's local zone and names it in
    // the machine's language (#543). Pinning both records that output as it
    // is, on macOS and on the Linux runner alike
    const result = runBber(['build', format], fixtureCopy, undefined, {
      TZ: 'UTC',
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
    })

    // The epub build writes all of its output, then EPUBCheck rejects the
    // iframe figure and the process exits 1 (TASK-056). Compare the output
    // regardless; the exit code is asserted for every other format
    if (format !== 'epub') expect(result.status, result.stderr).toBe(0)

    const outDir = path.join(fixtureCopy, `_builds-${format}`)
    expect(fs.existsSync(outDir), `${outDir} was not created`).toBe(true)

    const normalizer = createNormalizer([
      fixtureCopy,
      fs.realpathSync(fixtureCopy),
    ])
    const inventory: string[] = []

    for (const rel of listFiles(outDir)) {
      if (isReaderAppAsset(format, rel)) {
        inventory.push(`${normalizer.text('', `/${rel}`).slice(1)}  reader app`)
        continue
      }

      const data = fs.readFileSync(path.join(outDir, rel))
      if (isText(rel, data.length)) {
        inventory.push(`${rel}  text`)
        expect
          .soft(normalizer.text(rel, data.toString('utf8')), rel)
          .toMatchSnapshot([format, ...rel.split('/')])
      } else {
        inventory.push(`${rel}  sha256:${sha256(data)}`)
      }
    }

    for (const name of packagedFiles(format, fixtureCopy)) {
      inventory.push(`_root/${name}  text`)
      expect
        .soft(
          normalizer.text(
            name,
            fs.readFileSync(path.join(fixtureCopy, name), 'utf8')
          ),
          name
        )
        .toMatchSnapshot([format, '_root', name])
    }

    expect
      .soft(`${inventory.sort().join('\n')}\n`, 'the list of output files')
      .toMatchSnapshot([format, 'FILES.txt'])
  })
}
