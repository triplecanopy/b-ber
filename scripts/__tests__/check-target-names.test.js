const path = require('node:path')
const { findComparisons, renderSources } = require('../check-target-names')

const found = (source) => findComparisons(source).map(({ line }) => line)

describe('check-target-names findComparisons', () => {
  test.each([
    "if (state.build === 'reader') {",
    "return state.build !== 'web'",
    "const live = 'reader' === state.build",
    'return build === target',
    "if (ctx.target.name === 'mobi') {",
    "if (buildType == 'pdf') {",
    "const yes = x === 'epub'",
    'switch (state.build) {',
    'switch (ctx.target.name) {',
    "  case 'sample':",
  ])('flags %s', (source) => {
    expect(found(source)).toEqual([1])
  })

  test.each([
    'if (state.target.features.liveEmbeds) {',
    "const { type } = state.media[id][build]",
    "log.info(`omitting [${fileName}] for ${state.build} build`)",
    "const name = 'reader'",
    "if (type === 'gallery') {",
    "// state.build === 'reader' used to decide this",
    " * case 'web': in a doc comment",
  ])('allows %s', (source) => {
    expect(found(source)).toEqual([])
  })

  test('reports the line of each finding', () => {
    expect(found("one\nif (state.build === 'web') {}\nthree")).toEqual([2])
  })
})

describe('check-target-names renderSources', () => {
  const files = renderSources().map((file) =>
    path.relative(path.resolve(__dirname, '..', '..'), file)
  )

  test('reads the grammar, parser, renderer and template packages', () => {
    for (const pkg of [
      'b-ber-grammar-section',
      'b-ber-parser-figure',
      'b-ber-markdown-renderer',
      'b-ber-templates',
    ]) {
      expect(files.some((f) => f.startsWith(`packages/${pkg}/src/`))).toBe(true)
    }
  })

  test("leaves out the tasks and the new project's scaffold", () => {
    expect(files.some((f) => f.startsWith('packages/b-ber-tasks/'))).toBe(false)
    expect(
      files.some((f) => f.startsWith('packages/b-ber-templates/src/Project/'))
    ).toBe(false)
  })
})
