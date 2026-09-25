#!/usr/bin/env node

// Keeps `.github/dependabot.yml`'s 0.x ignore list honest.
//
// Semver treats a minor bump below 1.0.0 as breaking, but Dependabot classifies
// it as `semver-minor`, so the blanket major-ignore does not cover it. There is
// no general switch, so the 0.x dependencies are enumerated in dependabot.yml —
// and an enumerated list of something that changes is exactly the shape that
// drifts. This fails the build when it does.
//
//   node scripts/check-zero-major-deps.js

const { readFileSync, readdirSync, existsSync } = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const CONFIG = path.join(ROOT, '.github', 'dependabot.yml')

// Dependencies held back for a reason other than being 0.x. They may or may not
// be 0.x; either way this check should not police them.
const HELD_FOR_OTHER_REASONS = new Set(['js-yaml'])

function declaredZeroMajor() {
  const manifests = [
    path.join(ROOT, 'package.json'),
    ...readdirSync(path.join(ROOT, 'packages'))
      .map(d => path.join(ROOT, 'packages', d, 'package.json'))
      .filter(existsSync),
  ]

  const found = new Map()
  for (const manifest of manifests) {
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
    for (const section of ['dependencies', 'devDependencies']) {
      for (const [name, range] of Object.entries(pkg[section] || {})) {
        // lerna owns the first-party versions and moves them in lockstep.
        if (name.startsWith('@canopycanopycanopy/')) continue
        const match = range.match(/(\d+)\.(\d+)\.(\d+)/)
        if (match && match[1] === '0') {
          found.set(name, `${range}  (${path.relative(ROOT, manifest)})`)
        }
      }
    }
  }
  return found
}

// Deliberately a line scan rather than a YAML parse: the file is full of
// comments that explain *why* each entry exists, and this only needs the names.
function ignoredForMinor() {
  const lines = readFileSync(CONFIG, 'utf8').split('\n')
  const names = new Set()
  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].match(/^\s*-\s*dependency-name:\s*'([^']+)'/)
    if (!name) continue
    const rest = lines.slice(i + 1, i + 4).join('\n')
    if (/version-update:semver-minor/.test(rest)) names.add(name[1])
  }
  return names
}

const declared = declaredZeroMajor()
const ignored = ignoredForMinor()

const missing = [...declared.keys()].filter(
  n => !ignored.has(n) && !HELD_FOR_OTHER_REASONS.has(n),
)
const stale = [...ignored].filter(n => !declared.has(n))

if (missing.length === 0 && stale.length === 0) {
  console.log(
    `${declared.size} dependencies are on 0.x and all are held back from minor bumps`,
  )
  process.exit(0)
}

console.error('\n.github/dependabot.yml disagrees with the manifests:\n')
for (const name of missing) {
  console.error(`  NOT HELD  ${name} ${declared.get(name)}`)
  console.error('            a minor bump here is breaking; add a semver-minor ignore')
}
for (const name of stale) {
  console.error(`  STALE     ${name} is ignored for minor bumps but is no longer 0.x`)
  console.error('            it probably reached 1.0.0 — drop the ignore entry')
}
console.error('')
process.exit(1)
