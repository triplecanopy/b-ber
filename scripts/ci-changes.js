#!/usr/bin/env node

// Decides which CI jobs a pull request needs, from the files it changes
// (TASK-137).
//
// Each path falls into one of three tiers, and the PR takes the highest tier any
// of its files reaches:
//
//   inert  can't affect a build or a test: docs, task PRDs, templates, Renovate
//          config. Only the task-file check runs.
//   unit   tooling and Jest-only files: test specs, mocks, lint config, scripts,
//          workflows other than ci.yml. build-and-test runs; e2e does not.
//   full   anything that reaches the built output: package source, manifests
//          and lockfile, build config, the e2e suite and its fixtures, ci.yml.
//          Everything runs.
//
// Anything not matched by a rule below is `full`. That direction is deliberate:
// a file this script has never heard of should cost a CI run, not skip one.
//
// Markdown is NOT automatically inert. The kitchen-sink fixture and the demo
// project are Markdown that the build renders, so `**/_project/**` and
// `**/fixtures/**` stay `full`.
//
//   git diff --name-only main... | node scripts/ci-changes.js
//   node scripts/ci-changes.js --explain < files.txt   per-file reasons
//
// In GitHub Actions it appends `code=` and `e2e=` to $GITHUB_OUTPUT, and a
// summary table to $GITHUB_STEP_SUMMARY.

const { appendFileSync } = require('node:fs')

// Earlier rules win. Each is [tier, test, reason].
const RULES = [
  // Build inputs that happen to be Markdown. Must precede the `*.md` rule.
  ['full', (p) => /(^|\/)(_project|fixtures)\//.test(p), 'build fixture / project source'],

  ['inert', (p) => /^(docs|tasks)\//.test(p) && !p.endsWith('EPICS.json'), 'docs or task PRD'],
  ['inert', (p) => p.startsWith('.claude/'), 'agent skills'],
  ['inert', (p) => /^\.github\/(ISSUE_TEMPLATE\/|PULL_REQUEST_TEMPLATE\.md$)/.test(p), 'GitHub template'],
  ['inert', (p) => p.endsWith('.md'), 'Markdown documentation'],
  ['inert', (p) => /(^|\/)LICENSE[^/]*$/.test(p), 'licence'],
  ['inert', (p) => ['renovate.json5', '.editorconfig'].includes(p), 'editor / bot config'],

  // check-tasks validates EPICS.json, so it is not inert, but it is not built.
  ['unit', (p) => p === 'tasks/EPICS.json', 'epic list (validated by check:tasks)'],
  ['unit', (p) => /^packages\/[^/]+\/(__tests__|__mocks__|__stubs__)\//.test(p), 'Jest test, mock or stub'],
  ['unit', (p) => /(^|\/)jest\.config\.[cm]?js$/.test(p), 'Jest config'],
  ['unit', (p) => p.startsWith('scripts/') || p.startsWith('.github/scripts/'), 'repo script'],
  ['unit', (p) => /^\.github\/workflows\//.test(p) && p !== '.github/workflows/ci.yml', 'other workflow'],
  ['unit', (p) => p.startsWith('.husky/') || p.startsWith('.circleci/'), 'hooks / CircleCI'],
  ['unit', (p) => ['biome.json', 'commitlint.config.js', 'codecov.yml', '.gitignore'].includes(p), 'lint / coverage / repo config'],
]

const RANK = { inert: 0, unit: 1, full: 2 }

function classifyPath(path) {
  for (const [tier, test, reason] of RULES) {
    if (test(path)) return { path, tier, reason }
  }
  return { path, tier: 'full', reason: 'no rule matched: assume it reaches the build' }
}

function classify(paths) {
  const files = paths.map((p) => p.trim()).filter(Boolean).map(classifyPath)

  // No file list means the lookup failed. Run everything rather than nothing.
  if (files.length === 0) {
    return { tier: 'full', code: true, e2e: true, files, empty: true }
  }

  const tier = files.reduce((t, f) => (RANK[f.tier] > RANK[t] ? f.tier : t), 'inert')
  return { tier, code: tier !== 'inert', e2e: tier === 'full', files, empty: false }
}

function summary(result) {
  const lines = [
    `### CI scope: \`${result.tier}\``,
    '',
    `build-and-test: **${result.code ? 'run' : 'skip'}** · e2e: **${result.e2e ? 'run' : 'skip'}**`,
    '',
  ]
  if (result.empty) lines.push('No changed files were reported, so everything runs.', '')
  else {
    lines.push('| File | Tier | Why |', '| ---- | ---- | --- |')
    for (const f of result.files) lines.push(`| \`${f.path}\` | ${f.tier} | ${f.reason} |`)
  }
  return `${lines.join('\n')}\n`
}

async function main() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const result = classify(Buffer.concat(chunks).toString('utf8').split('\n'))

  if (process.argv.includes('--explain')) {
    for (const f of result.files) console.log(`${f.tier.padEnd(5)}  ${f.path}  (${f.reason})`)
  }
  console.log(`tier=${result.tier} code=${result.code} e2e=${result.e2e}`)

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `code=${result.code}\ne2e=${result.e2e}\n`)
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary(result))
  }
}

if (require.main === module) {
  main()
}

module.exports = { classify, classifyPath }
