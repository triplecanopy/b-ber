#!/usr/bin/env node

// Finds dependencies a manifest declares that nothing appears to use.
//
// This exists because Dependabot can only propose a version, never a deletion,
// so a package nothing imports is invisible to it — and four of those have been
// found here by accident: tar (248 alerts), sass-lint (6), the Redux trio, and
// bs-html-injector (21, of which 16 had no patched version at all).
//
// It reports, it does not decide. `bs-html-injector` was resolved by string name
// in a plugin config and would have looked unused to any grep, so anything this
// cannot prove is used comes back as `uncertain` rather than `unused`.
//
//   node scripts/check-unused-deps.js            report every manifest
//   node scripts/check-unused-deps.js --json     machine-readable

const { readFileSync, readdirSync, statSync, existsSync } = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')

// Used without ever being imported, by a mechanism the scanner cannot see.
// Each entry is a claim that the package is resolved some other way; keep the
// reason with it so a later reader can re-check rather than trust.
const KNOWN_NON_IMPORTED = new Map([
  ['@biomejs/biome', 'invoked by npm scripts; configured in biome.json'],
  ['husky', 'git hooks, installed by lifecycle script'],
  ['lint-staged', 'invoked from .husky/pre-commit'],
  ['@commitlint/cli', 'invoked from .husky/commit-msg'],
  ['@commitlint/config-conventional', 'named in commitlint config'],
  ['lerna', 'invoked by npm scripts and CI'],
  ['syncpack', 'invoked by deps:dedupe'],
  ['npm-check-updates', 'invoked by deps:update'],
  ['madge', 'invoked by check:circular'],
  ['rimraf', 'invoked by clean scripts'],
  ['jest', 'test runner; configured in jest.config'],
  ['ts-jest', 'jest transform, named in config'],
  ['@swc/jest', 'jest transform, named in jest config'],
  ['@swc/core', 'loaded by @swc/jest as its compiler; never imported directly'],
  ['jest-environment-jsdom', 'jest testEnvironment, named in config'],
  ['identity-obj-proxy', 'jest moduleNameMapper, named in config'],
  ['tsdown', 'build tool, invoked by npm scripts'],
  ['typescript', 'compiler, invoked by typecheck'],
  ['conventional-changelog-cli', 'invoked by the changelog script'],
  ['browserslist', 'read from package.json config by the toolchain'],
  ['update-browserslist-db', 'invoked by browserslist:update'],
  ['sass', 'Vite compiles .scss only when sass is installed; never imported'],
])

// A package that some *other* declared dependency lists as a peer is in use even
// though nothing imports it — the dependent loads it. @testing-library/dom is the
// case that caught this: removing it broke 39 suites via @testing-library/react.
function peersOfDeclared(declared, dir) {
  const peers = new Set()
  for (const name of Object.keys(declared)) {
    // Resolve from the package's own directory so workspace hoisting is followed.
    let manifest
    try {
      manifest = require.resolve(`${name}/package.json`, { paths: [dir, ROOT] })
    } catch {
      continue
    }
    let meta
    try {
      meta = JSON.parse(readFileSync(manifest, 'utf8'))
    } catch {
      continue
    }
    for (const peer of Object.keys(meta.peerDependencies || {})) peers.add(peer)
  }
  return peers
}

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.scss', '.sass', '.css'])
const CONFIG_EXT = new Set(['.json', '.yml', '.yaml', '.toml'])
const SKIP_DIR = new Set(['node_modules', 'dist', 'coverage', '.git', 'build'])

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue
    const full = path.join(dir, entry)
    let stats
    try {
      stats = statSync(full)
    } catch {
      continue
    }
    if (stats.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

// A real module reference: import, require, dynamic import, side-effect import,
// or a jest mock. This is the strong signal.
function imports(haystack, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return [
    new RegExp(`from\\s+['"\`]${escaped}(?:/|['"\`])`),
    new RegExp(`require\\(\\s*['"\`]${escaped}(?:/|['"\`])`),
    new RegExp(`import\\(\\s*['"\`]${escaped}(?:/|['"\`])`),
    new RegExp(`import\\s+['"\`]${escaped}(?:/|['"\`])`),
    new RegExp(`jest\\.mock\\(\\s*['"\`]${escaped}(?:/|['"\`])`),
    // SCSS: `@use 'x'`, `@import 'x'`, and the `~x` webpack-style prefix the
    // theme packages still use. Missing these made modularscale-sass look dead.
    new RegExp(`@(?:use|import|forward)\\s+['"\`]~?${escaped}(?:/|['"\`])`),
  ].some(re => re.test(haystack))
}

// A quoted bare reference — how a plugin gets resolved by name, and how
// bs-html-injector hid from grep. Weaker, but enough to stop calling it dead.
function namedAsString(haystack, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`['"\`]${escaped}(?:/[^'"\`]*)?['"\`]`).test(haystack)
}

// A binary invoked from an npm script, e.g. `rimraf dist`.
function invoked(scripts, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[\\s"'&|;(])${escaped}(?:[\\s"'&|;)]|$)`).test(scripts)
}

function analyse(manifestPath) {
  const dir = path.dirname(manifestPath)
  const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const declared = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  // peerDependencies count as "present" for the @types/x check without being
  // candidates themselves — reader-react peers react rather than depending on it.
  const present = { ...declared, ...(pkg.peerDependencies || {}) }

  const files = walk(dir)
  const source = files
    .filter(f => SOURCE_EXT.has(path.extname(f)))
    .map(f => readFileSync(f, 'utf8'))
    .join('\n')
  // Manifests are excluded: a dependency always appears in the file that
  // declares it, which would make every package trivially "referenced".
  const config = files
    .filter(
      f =>
        CONFIG_EXT.has(path.extname(f)) &&
        path.basename(f) !== 'package.json' &&
        path.basename(f) !== 'package-lock.json',
    )
    .map(f => readFileSync(f, 'utf8'))
    .join('\n')
  const scripts = JSON.stringify(pkg.scripts || {})
  const peers = peersOfDeclared(declared, dir)

  const unused = []
  const uncertain = []

  for (const name of Object.keys(declared)) {
    // lerna owns the first-party cross-dependencies.
    if (name.startsWith('@canopycanopycanopy/')) continue

    // @types/x is used exactly when x is. @types/node is ambient.
    if (name.startsWith('@types/')) {
      const base = name.slice('@types/'.length).replace('__', '/')
      if (base === 'node' || base in present) continue
      uncertain.push({ name, why: `no matching \`${base}\` declared` })
      continue
    }

    if (imports(source, name)) continue
    if (KNOWN_NON_IMPORTED.has(name)) continue
    if (invoked(scripts, name)) continue
    if (peers.has(name)) continue

    if (namedAsString(source, name)) {
      uncertain.push({ name, why: 'referenced by name in source, never imported' })
      continue
    }
    if (namedAsString(config, name)) {
      uncertain.push({ name, why: 'named in a config file, never imported' })
      continue
    }

    unused.push({ name, version: declared[name] })
  }

  return { manifest: path.relative(ROOT, manifestPath), unused, uncertain }
}

function main() {
  const manifests = [
    path.join(ROOT, 'package.json'),
    ...readdirSync(path.join(ROOT, 'packages'))
      .map(d => path.join(ROOT, 'packages', d, 'package.json'))
      .filter(existsSync),
  ]

  const results = manifests.map(analyse)

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(results, null, 2))
    return
  }

  let totalUnused = 0
  let totalUncertain = 0

  for (const { manifest, unused, uncertain } of results) {
    if (unused.length === 0 && uncertain.length === 0) continue
    console.log(`\n${manifest}`)
    for (const { name, version } of unused) {
      console.log(`  UNUSED     ${name}@${version}`)
      totalUnused++
    }
    for (const { name, why } of uncertain) {
      console.log(`  uncertain  ${name} — ${why}`)
      totalUncertain++
    }
  }

  console.log(
    `\n${totalUnused} unused, ${totalUncertain} uncertain, across ${manifests.length} manifests.`,
  )
  console.log('Confirm each one by hand before removing it — bs-html-injector was')
  console.log('resolved by string name in a plugin config and looked unused to grep.')
}

main()
