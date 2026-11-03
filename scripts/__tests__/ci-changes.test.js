const { execFileSync } = require('node:child_process')
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { classify, classifyPath, changedFilesBetween } = require('../ci-changes')

const tierOf = (p) => classifyPath(p).tier

describe('ci-changes classifyPath', () => {
  test.each([
    'docs/dependency-update-policy.md',
    'tasks/TASK-137.md',
    'AGENTS.md',
    'packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md',
    'packages/b-ber-lib/README.md',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/ISSUE_TEMPLATE/bug_report.md',
    '.claude/skills/task-prd.md',
    'packages/b-ber-reader-react/LICENSE.md',
    'LICENSE',
    'renovate.json5',
  ])('%s is inert', (p) => {
    expect(tierOf(p)).toBe('inert')
  })

  test.each([
    'packages/b-ber-lib/__tests__/State.test.js',
    'packages/b-ber-cli/__stubs__/b-ber-lib.js',
    'packages/b-ber-validator/__mocks__/fs.js',
    'jest.config.js',
    'packages/b-ber-validator/jest.config.js',
    'scripts/check-tasks.js',
    '.github/scripts/build-release-commit.js',
    '.github/workflows/release-publish.yml',
    '.circleci/config.yml',
    'biome.json',
    'codecov.yml',
    'tasks/EPICS.json',
  ])('%s is unit', (p) => {
    expect(tierOf(p)).toBe('unit')
  })

  test.each([
    'packages/b-ber-lib/src/State.ts',
    'packages/b-ber-reader-react/src/components/App.tsx',
    'package.json',
    'package-lock.json',
    'packages/b-ber-cli/package.json',
    '.github/workflows/ci.yml',
    'tsconfig.base.json',
    'lerna.json',
    'packages/b-ber-testing/tests/cli/helpers.ts',
    'packages/b-ber-testing/playwright.config.ts',
    // Markdown the build renders: must not be mistaken for docs.
    'packages/b-ber-testing/fixtures/kitchen-sink/_project/_markdown/chapter-01.md',
    'demos/basic/_project/_markdown/intro.md',
    // A file no rule knows about errs towards running everything.
    'some/new/thing.xyz',
  ])('%s is full', (p) => {
    expect(tierOf(p)).toBe('full')
  })
})

describe('ci-changes classify', () => {
  test('docs only: nothing heavy runs', () => {
    expect(classify(['docs/a.md', 'tasks/TASK-001.md'])).toMatchObject({
      tier: 'inert',
      code: false,
      e2e: false,
    })
  })

  test('takes the highest tier among its files', () => {
    expect(classify(['docs/a.md', 'scripts/x.js'])).toMatchObject({
      tier: 'unit',
      code: true,
      e2e: false,
    })
    expect(
      classify(['docs/a.md', 'scripts/x.js', 'packages/b-ber-lib/src/a.ts'])
    ).toMatchObject({ tier: 'full', code: true, e2e: true })
  })

  test('an empty file list runs everything', () => {
    expect(classify(['', '  '])).toMatchObject({
      tier: 'full',
      code: true,
      e2e: true,
      empty: true,
    })
  })
})

// Merge-queue runs list files from git rather than the PR API (TASK-138). A
// real repository, because the point is what git reports, not what a mock says.
describe('ci-changes changedFilesBetween', () => {
  let dir
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim()
  const write = (file, text) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), text)
  }

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'ci-changes-'))
    git('init', '-q')
    git('config', 'user.email', 'test@example.com')
    git('config', 'user.name', 'test')
    git('config', 'commit.gpgsign', 'false')
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  test('lists added, modified, deleted and renamed files, renames under both names', () => {
    write('docs/keep.md', 'a\n')
    write('docs/edit.md', 'a\n')
    write('docs/drop.md', 'a\n')
    write('packages/b-ber-lib/src/old-name.ts', 'export const x = 1\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'base')
    const base = git('rev-parse', 'HEAD')

    write('docs/edit.md', 'b\n')
    write('docs/new file.md', 'a\n')
    git('rm', '-q', 'docs/drop.md')
    git('mv', 'packages/b-ber-lib/src/old-name.ts', 'packages/b-ber-lib/src/new-name.ts')
    git('add', '-A')
    git('commit', '-q', '-m', 'head')
    const head = git('rev-parse', 'HEAD')

    expect(changedFilesBetween(base, head, dir).sort()).toEqual([
      'docs/drop.md',
      'docs/edit.md',
      'docs/new file.md',
      'packages/b-ber-lib/src/new-name.ts',
      'packages/b-ber-lib/src/old-name.ts',
    ])
  })

  test('a docs-only merge group classifies as inert', () => {
    write('packages/b-ber-lib/src/a.ts', 'export const a = 1\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'base')
    const base = git('rev-parse', 'HEAD')

    write('tasks/TASK-999.md', '# TASK-999\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'docs')
    const head = git('rev-parse', 'HEAD')

    expect(classify(changedFilesBetween(base, head, dir))).toMatchObject({
      tier: 'inert',
      code: false,
      e2e: false,
    })
  })

  test('identical commits give no files, which classify runs in full', () => {
    write('a.txt', 'a\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'base')
    const head = git('rev-parse', 'HEAD')

    expect(changedFilesBetween(head, head, dir)).toEqual([])
    expect(classify(changedFilesBetween(head, head, dir))).toMatchObject({ tier: 'full', empty: true })
  })

  test('an unknown commit throws, so the CI job fails open', () => {
    write('a.txt', 'a\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'base')

    expect(() => changedFilesBetween('0'.repeat(40), 'HEAD', dir)).toThrow()
  })
})
