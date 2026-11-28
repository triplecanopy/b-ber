import path from 'node:path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import { check, report } from '@canopycanopycanopy/b-ber-validator'
import fs from 'fs-extra'

// What `bber check` found
export interface ValidateResult {
  files: number
  errors: number
  warnings: number
}

const count = (n: number, noun: string): string =>
  `${n} ${noun}${n === 1 ? '' : 's'}`

// Checks every Markdown file of the project with the parse the build runs,
// and prints each diagnostic as TASK-161's reporter formats it.
//
// The report is written to stdout, as tsc and ESLint write theirs, and not
// through the logger: the logger trims every line of a message and
// highlights `[text]`, which would move the carets off the spans they mark
const validate = async ({
  project,
}: {
  project: string
}): Promise<ValidateResult> => {
  const markdownPath = path.resolve(
    process.cwd(),
    project,
    state.src.markdown()
  )

  if (!fs.pathExists(markdownPath)) {
    throw log.error('Project path does not exist, aborting')
  }

  const files = (await fs.readdir(markdownPath))
    .filter((f) => f.slice(-2).toLowerCase() === 'md')
    .sort()

  const color = Boolean(process.stdout.isTTY) && !log.boringOutput
  const result: ValidateResult = { files: files.length, errors: 0, warnings: 0 }

  const sources = await Promise.all(
    files.map((name) => fs.readFile(path.join(markdownPath, name), 'utf8'))
  )

  // In file order, so that the report reads the same every run
  for (const [i, name] of files.entries()) {
    const source = sources[i]
    // Named as the build names them, whatever the project's `src`
    const diagnostics = check(source, `_markdown/${name}`)

    if (!diagnostics.length) log.info('Directives valid %s', name)
    for (const diagnostic of diagnostics) {
      process.stdout.write(`${report(source, diagnostic, { color })}\n\n`)
      if (diagnostic.severity === 'error') result.errors++
      else result.warnings++
    }
  }

  if (!result.errors && !result.warnings) {
    log.notice('Directives valid in %s', count(result.files, 'file'))
    return result
  }

  const summary = `${count(result.errors, 'error')} and ${count(result.warnings, 'warning')} in ${count(result.files, 'file')}`

  // An error fails the check, so that `bber check` exits 1 and can gate a CI
  // run. It resolved whatever it found until TASK-178 (#796)
  if (result.errors) throw log.error('Check failed: %s', summary)

  log.notice(summary)
  return result
}

export default validate
