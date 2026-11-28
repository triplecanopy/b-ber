#!/usr/bin/env node
// Runs the directive parse over a directory of b-ber projects and prints,
// for each diagnostic code, how many there are and in which projects.
// TASK-161's test 9: the GitLab projects are private, so this is run by hand
// before a parser change lands, never in CI.
//
//   npm run build
//   node scripts/parse-corpus.js <projects root> [--verbose]
//
// A project is a directory with a config.yml and a `<src>/_markdown`
// directory, found as gitlab-projects/_survey/survey.js finds them. Each
// Markdown file is parsed as the build parses it (every plugin registered),
// from its source as written, so the positions are the author's. Nothing is
// written inside the projects, and nothing from them is copied anywhere.

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const [root, flag] = process.argv.slice(2)
if (!root) {
  process.stderr.write(
    'usage: node scripts/parse-corpus.js <projects root> [--verbose]\n'
  )
  process.exit(2)
}
const corpus = path.resolve(root)
const verbose = flag === '--verbose'

// b-ber-lib's State loads `_project/toc.yml` from the working directory when
// it is first required, so give it an empty project of its own
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'parse-corpus-'))
fs.mkdirSync(path.join(work, '_project', '_media'), { recursive: true })
fs.writeFileSync(path.join(work, '_project', 'toc.yml'), '[]\n')
process.chdir(work)

const pkg = path.resolve(__dirname, '..')
// The parse `bber check` runs: the build's, reporting every problem
const { parse, locate } = require(path.join(pkg, 'dist', 'parse.js'))

// Repos sit at <root>/<name> or <root>/<subgroup>/<name>
function repos(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('.') || e.name.startsWith('_'))
      continue
    const p = path.join(dir, e.name)
    if (fs.existsSync(path.join(p, '.git'))) out.push(p)
    else out.push(...repos(p))
  }
  return out
}

// A project has a config.yml at the repo's top, or one level down
function projects(repo, depth = 0) {
  const out = []
  const config = path.join(repo, 'config.yml')
  if (fs.existsSync(config)) {
    const m = fs.readFileSync(config, 'utf8').match(/^src:\s*(.+)$/m)
    const src = m ? m[1].trim().replace(/^['"]|['"]$/g, '') : '_project'
    const markdown = path.join(repo, src, '_markdown')
    if (fs.existsSync(markdown)) out.push(markdown)
  }
  if (depth < 1)
    for (const e of fs.readdirSync(repo, { withFileTypes: true }))
      if (
        e.isDirectory() &&
        !e.name.startsWith('.') &&
        e.name !== 'node_modules'
      )
        out.push(...projects(path.join(repo, e.name), depth + 1))
  return out
}

const byCode = new Map() // code -> { count, projects: Set }
let files = 0
let projectCount = 0
const failures = []

for (const repo of repos(corpus)) {
  for (const markdown of projects(repo)) {
    projectCount++
    const project = path.relative(corpus, path.dirname(path.dirname(markdown)))
    const names = fs.readdirSync(markdown).filter((f) => f.endsWith('.md'))
    for (const name of names.sort()) {
      files++
      const file = path.relative(corpus, path.join(markdown, name))
      const src = fs.readFileSync(path.join(markdown, name), 'utf8')
      let diagnostics
      try {
        ;({ diagnostics } = parse(src, file))
      } catch (err) {
        failures.push(`${file}: ${err.message}`)
        continue
      }
      const text = src.replace(/\r\n?/g, '\n')
      for (const d of diagnostics) {
        const entry = byCode.get(d.code) ?? { count: 0, projects: new Set() }
        entry.count++
        entry.projects.add(project)
        byCode.set(d.code, entry)
        if (verbose) {
          const { line, column } = locate(text, d.span.start)
          process.stdout.write(
            `${d.file}:${line}:${column} - ${d.severity} ${d.code}: ${d.message}\n`
          )
        }
      }
    }
  }
}

fs.rmSync(work, { recursive: true, force: true })

process.stdout.write(
  `${projectCount} projects, ${files} Markdown files, ${failures.length} that did not parse\n\n`
)
for (const failure of failures) process.stdout.write(`  ${failure}\n`)
for (const [code, { count, projects: p }] of [...byCode].sort()) {
  process.stdout.write(
    `${code}: ${count} in ${p.size} project${p.size === 1 ? '' : 's'}\n  ${[...p].sort().join(', ')}\n`
  )
}
