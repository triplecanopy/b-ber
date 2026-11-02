const { classify, classifyPath } = require('../ci-changes')

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
