// TASK-161's test 7, agreement: for every case and fixture, `bber check` and
// the build report the same diagnostics. #797 was a disagreement between them,
// when b-ber-validator had a grammar of its own.
//
// The build's side is the build's renderer (b-ber-markdown-renderer's
// singleton, with the host that throws), whose env collects the diagnostics
// of the document's parse. Where the build stops on a duplicate or missing
// id, `check` reports an error at the line the build names, and goes on.

import path from 'node:path'
import { types } from 'node:util'
import log from '@canopycanopycanopy/b-ber-logger'
import markdownRenderer from '@canopycanopycanopy/b-ber-markdown-renderer'
import { locate } from '@canopycanopycanopy/b-ber-markdown-renderer/parse'
import fs from 'fs-extra'
import * as mocks from '../__mocks__'
import { check } from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger')

// An automocked `log.error` returns undefined, and the build throws what it
// returns
beforeEach(() => {
  log.error.mockImplementation((err) =>
    types.isNativeError(err) ? err : new Error(String(err))
  )
})

const KITCHEN_SINK = path.resolve(
  __dirname,
  '../../b-ber-testing/fixtures/kitchen-sink/_project'
)

// What the build is told about a kitchen-sink document that the render's
// defaults (an epub, the first document of its book) do not say
const documentFor = () => ({
  images: (name) => path.join(KITCHEN_SINK, '_images', name),
  audio: ['sample.mp3'],
  video: ['sample.mp4'],
})

// The build's diagnostics for `source`, or the error it stopped at. A case
// without the assets its directives name stops the render, after the parse,
// so for those the build's side is the build's parse
const build = (name, source) => {
  const fileName = path.basename(name, '.md')
  const file = `_markdown/${name}`
  try {
    const env = { file, document: documentFor() }
    markdownRenderer.render(fileName, source, env)
    return { diagnostics: env.diagnostics, rendered: true }
  } catch {
    try {
      const env = { file, document: documentFor() }
      return {
        diagnostics: markdownRenderer.parse(fileName, source, env).diagnostics,
        rendered: false,
      }
    } catch (error) {
      return { error }
    }
  }
}

// One source per code the parse reports, with its construct on line 1, after
// five lines of text, and after front matter (TASK-161's tests 1–3)
const CODES = {
  'unknown-name': '::: chaptr:a\n',
  'draft-name': '::: credits:a\n\n::: exit:a\n',
  'deprecated-name': '::: subchapter:a\n\n::: exit:a\n',
  'missing-id': '::: chapter\n',
  'missing-id, with a colon': '::: chapter:\n',
  'id-characters': '::: chapter:a.b\n\n::: exit:a.b\n',
  'duplicate-id':
    '::: chapter:a\n\n::: exit:a\n\n::: section:a\n\n::: exit:a\n',
  'unknown-attribute': '::: chapter:a bogus:x\n\n::: exit:a\n',
  'duplicate-attribute':
    '::: chapter:a classes:x classes:"y z"\n\n::: exit:a\n',
  'missing-value': '::: chapter:a classes:\n\n::: exit:a\n',
  'unterminated-quote': '::: chapter:a title:"open\n\n::: exit:a\n',
  'stray-word': '::: chapter:a extra\n\n::: exit:a\n',
  'attribute-form': '::: chapter:a title "x"\n\n::: exit:a\n',
  'unclosed-block': '::: chapter:a\n\nBody\n',
  'unmatched-exit': '::: exit:zzz\n',
  'crossed-exit': '::: chapter:a\n\n::: section:b\n\n::: exit:a\n',
  'exit-missing-id': '::: exit\n',
  'exit-trailing-text': '::: chapter:a\n\n::: exit:a done\n',
  'an exit after a single-line directive':
    '::: figure:f source:placeholder-square-01.png\n\n::: exit:f\n',
  'a block in a list item': '- item\n\n  ::: chapter:a\n\n  text\n',
  'a block in a blockquote': '> ::: pullquote:q\n>\n> text\n',
}

const SHAPES = {
  'on line 1': (src) => src,
  'after text': (src) => `${'Text.\n\n'.repeat(5)}${src}`,
  'after front matter': (src) => `---\ntitle: T\n---\n\n${src}`,
}

const CASES = [
  ...Object.entries(CODES).flatMap(([code, src]) =>
    Object.entries(SHAPES).map(([shape, of]) => [`${code}, ${shape}`, of(src)])
  ),
  ...Object.entries(mocks).map(([name, src]) => [`old mock ${name}`, src]),
]

const lineOf = (source, d) => locate(source, d.span.start).line

const agree = (name, source) => {
  const file = `_markdown/${name}`
  const built = build(name, source)
  if (!built.error) {
    expect(check(source, file)).toEqual(built.diagnostics)
    return
  }
  const errors = check(source, file).filter((d) => d.severity === 'error')
  // The build names the line it stopped at as `<file>.md:<line>`
  const [, line] = built.error.message.match(/\.md:(\d+)\]?$/) ?? []
  expect(line).toBeDefined()
  expect(errors.map((d) => lineOf(source, d))).toContain(Number(line))
}

describe('b-ber-validator: check agrees with the build', () => {
  it.each(CASES)('%s', (_, source) => {
    // A figure with no source stops both, with the same error
    if (/figure-inline:idA\n$/.test(source)) {
      expect(() => check(source, '_markdown/x.md')).toThrow(
        build('x.md', source).error.message
      )
      return
    }
    agree('x.md', source)
  })

  const fixtures = fs
    .readdirSync(path.join(KITCHEN_SINK, '_markdown'))
    .filter((f) => f.endsWith('.md'))
    .sort()

  it.each(fixtures)('kitchen-sink %s', (name) => {
    const source = fs.readFileSync(
      path.join(KITCHEN_SINK, '_markdown', name),
      'utf8'
    )
    const built = build(name, source)
    expect(built).toMatchObject({ rendered: true })
    expect(check(source, `_markdown/${name}`)).toEqual(built.diagnostics)
  })

  // TASK-161's test 8: no errors, and the warnings it is expected to give
  it('finds no errors in the kitchen-sink, and one warning per subchapter', () => {
    const found = fixtures.flatMap((name) =>
      check(
        fs.readFileSync(path.join(KITCHEN_SINK, '_markdown', name), 'utf8'),
        `_markdown/${name}`
      )
    )
    expect(found.filter((d) => d.severity === 'error')).toEqual([])
    expect([...new Set(found.map((d) => d.code))]).toEqual(['deprecated-name'])
  })
})
