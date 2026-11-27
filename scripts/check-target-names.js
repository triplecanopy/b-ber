#!/usr/bin/env node

// Fails on a comparison with a target's name in render code: the grammar,
// parser, renderer and template packages. Those branch on the target's
// features (`state.target.features`, TASK-164), so that what a target
// supports is declared once, in b-ber-lib's `Target.ts`, rather than spread
// over 28 `state.build === 'reader'` checks as it was.
//
// Using the name as an identifier is fine: grammar-media's key into
// media.yml, a log message. Comparing it is not.
//
//   node scripts/check-target-names.js

const { readdirSync, readFileSync } = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')

const TARGETS = ['epub', 'mobi', 'pdf', 'web', 'reader', 'sample', 'xml']

// The packages whose source renders output
const RENDER_PACKAGE = /^b-ber-(grammar-.+|parser-.+|markdown-renderer|templates)$/

// The scaffold `bber new` writes is a project's own script, which may branch
// on `window.bber.env`: that is one of the four places a target's name is
// public (TASK-160)
const EXEMPT = [path.join('packages', 'b-ber-templates', 'src', 'Project')]

const NAME = `['"\`](?:${TARGETS.join('|')})['"\`]`
// What holds a target's name: `build`, `state.build`, `target.name`,
// `buildType`, `env`
const HOLDER = String.raw`(?:\bbuild(?:Type)?|\btarget\.name|\benv)\b`
const EQ = '(?:===|!==|==|!=)'

const RULES = [
  [new RegExp(`${HOLDER}\\s*${EQ}`), 'compares a target name'],
  [new RegExp(`${EQ}\\s*${HOLDER}`), 'compares a target name'],
  [new RegExp(`${EQ}\\s*${NAME}`), 'compares with a target name'],
  [new RegExp(`${NAME}\\s*${EQ}`), 'compares with a target name'],
  [new RegExp(`\\bswitch\\s*\\([^)]*${HOLDER}`), 'switches on a target name'],
  [new RegExp(`\\bcase\\s+${NAME}\\s*:`), 'switches on a target name'],
]

// Every finding in one file's source: { line, text, reason }
function findComparisons(source) {
  const found = []
  source.split('\n').forEach((text, index) => {
    const trimmed = text.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return
    for (const [pattern, reason] of RULES) {
      if (pattern.test(text)) {
        found.push({ line: index + 1, text: trimmed, reason })
        return
      }
    }
  })
  return found
}

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (EXEMPT.some((exempt) => path.relative(ROOT, file) === exempt)) return []
    if (entry.isDirectory()) return sourceFiles(file)
    return /\.[jt]sx?$/.test(entry.name) ? [file] : []
  })
}

function renderSources(root = ROOT) {
  const packages = path.join(root, 'packages')
  return readdirSync(packages)
    .filter((name) => RENDER_PACKAGE.test(name))
    .flatMap((name) => {
      const src = path.join(packages, name, 'src')
      try {
        return sourceFiles(src)
      } catch {
        return []
      }
    })
}

function main() {
  const failures = renderSources().flatMap((file) =>
    findComparisons(readFileSync(file, 'utf8')).map(
      ({ line, text, reason }) =>
        `${path.relative(ROOT, file)}:${line}: ${reason}\n    ${text}`
    )
  )

  if (failures.length) {
    console.error(
      `Render code branches on a target's name. Branch on state.target.features instead (TASK-164):\n\n${failures.join('\n')}`
    )
    process.exitCode = 1
    return
  }
  console.log('check-target-names: no target name comparisons in render code')
}

if (require.main === module) main()

module.exports = { findComparisons, renderSources }
