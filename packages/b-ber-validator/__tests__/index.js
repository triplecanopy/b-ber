import { locate } from '@canopycanopycanopy/b-ber-markdown-renderer/parse'
import * as mocks from '../__mocks__'
import { check, report } from '../src'

// The cases the parser-combinator grammar was tested on (TASK-178 deleted
// it), each now asserting what the shared parse says about it: the code and
// the `line:col` of each diagnostic. Where the verdict changed, the comment
// says what the old grammar said
const diagnose = (text) =>
  check(text, '_markdown/x.md').map((d) => {
    const { line, column } = locate(text, d.span.start)
    return `${d.code}@${line}:${column}`
  })

// Every mock gives `chapter` the attributes `foo` and `baz`, which it does not
// have: two `unknown-attribute` warnings per opener, left out here
const structural = (text) =>
  diagnose(text).filter((d) => !d.startsWith('unknown-attribute'))

describe('b-ber-validator: check', () => {
  it('passes a closed block', () => {
    expect(structural(mocks.test1)).toEqual([])
  })

  it('passes content', () => {
    expect(diagnose(mocks.test2)).toEqual([])
  })

  it('passes a single-line directive', () => {
    expect(diagnose(mocks.test3)).toEqual([])
  })

  it('passes blocks, single-line directives and both', () => {
    for (const text of [mocks.test4, mocks.test5, mocks.test6]) {
      expect(structural(text)).toEqual([])
    }
  })

  it('passes nested blocks, with directives and content inside', () => {
    for (const text of [mocks.test7, mocks.test8, mocks.test9, mocks.test10]) {
      expect(structural(text)).toEqual([])
    }
  })

  it('names the attributes a block does not have', () => {
    expect(diagnose(mocks.test1)).toEqual([
      'unknown-attribute@2:17',
      'unknown-attribute@2:25',
    ])
  })

  // The old grammar failed each of these with "Closing identifier to match
  // opening identifier". They are warnings now (TASK-161, decision 7): books
  // that build today rely on them
  describe('an exit that does not match', () => {
    it('reports an exit that closes nothing, and the block left open', () => {
      expect(structural(mocks.test11)).toEqual([
        'unclosed-block@2:1',
        'unmatched-exit@3:1',
      ])
      expect(structural(mocks.test30)).toEqual([
        'unclosed-block@2:1',
        'unmatched-exit@3:1',
      ])
    })

    it('reports an exit given twice', () => {
      expect(structural(mocks.test12)).toEqual([
        'unclosed-block@2:1',
        'unmatched-exit@5:1',
      ])
    })

    it('reports an exit that crosses an open block', () => {
      expect(structural(mocks.test13)).toEqual([
        'unmatched-exit@5:1',
        'crossed-exit@6:1',
      ])
    })

    it('reports the blocks never closed', () => {
      expect(structural(mocks.test27)).toEqual([
        'unclosed-block@2:1',
        'unclosed-block@3:1',
      ])
    })
  })

  // The old grammar failed every one of these. Each is a warning now: the
  // build ignores what it cannot read and goes on
  describe('attributes', () => {
    it('reports an unknown directive, which is rendered as text', () => {
      // The old grammar: "Valid directive name"
      expect(diagnose(mocks.test14)).toEqual([
        'unknown-name@2:5',
        'unmatched-exit@3:1',
      ])
    })

    it('reports a word that is not an attribute', () => {
      expect(diagnose(mocks.test15)).toEqual(['stray-word@2:17'])
      expect(structural(mocks.test17)).toEqual(['stray-word@2:34'])
      expect(structural(mocks.test20)).toEqual(['stray-word@2:40'])
    })

    it('reports a quote that is not closed on its line', () => {
      expect(structural(mocks.test18)).toEqual(['unterminated-quote@2:29'])
      expect(structural(mocks.test19)).toEqual(['unterminated-quote@2:29'])
    })

    it('reads a doubled colon as part of the value', () => {
      expect(diagnose(mocks.test16)).toEqual(['unknown-attribute@2:17'])
      expect(diagnose(mocks.test22)).toEqual(['unknown-attribute@2:17'])
    })

    it('accepts runs of spaces between attributes', () => {
      // The old grammar failed this one
      expect(diagnose(mocks.test21)).toEqual([
        'unknown-attribute@2:26',
        'unknown-attribute@2:36',
      ])
    })
  })

  // The old grammar failed the first three: two directives on one line, a
  // caption with no text, a caption with no closing `::`
  it('passes the single-line directives the build reads', () => {
    for (const text of [mocks.test23, mocks.test24, mocks.test25]) {
      expect(diagnose(text)).toEqual([])
    }
    expect(diagnose(mocks.test26)).toEqual([])
  })

  it('throws where the build throws: a figure with no source', () => {
    // The old grammar passed it, and the build stopped on it
    expect(() => check(mocks.test31, '_markdown/x.md')).toThrow(
      'Missing [id] or [source] attribute for [figure] directive'
    )
  })

  it('passes an empty document', () => {
    expect(diagnose(mocks.test28)).toEqual([])
    expect(diagnose(mocks.test29)).toEqual([])
  })

  it('passes a dialogue, whatever its speaker lines', () => {
    // The old grammar failed test34 to test37 on the speaker lines, which the
    // build renders as text when they are not `:: name ::`
    for (const text of [
      mocks.test32,
      mocks.test33,
      mocks.test34,
      mocks.test35,
      mocks.test36,
      mocks.test37,
    ]) {
      expect(diagnose(text)).toEqual([])
    }
  })

  // #797: the old grammar read a directive only after a newline, so a file
  // opening with a closed block failed and one opening an unclosed block
  // passed
  it('reads a directive on the first line', () => {
    expect(diagnose('::: chapter:a\n\n::: exit:a\n')).toEqual([])
    expect(diagnose('::: chapter:a\n')).toEqual(['unclosed-block@1:1'])
  })

  it('reports what the build stops at, every one', () => {
    expect(
      diagnose('::: chapter:a\n::: exit:a\n::: chapter:a\n::: exit:a\n')
    ).toEqual(['duplicate-id@3:13'])
    expect(diagnose('::: chapter\n\n::: exit\n')).toEqual([
      'missing-id@1:5',
      'exit-missing-id@3:5',
    ])
  })

  it('names the file as it is given', () => {
    const [d] = check('::: chaptr:a\n', '_markdown/ch-01.md')
    expect(d.file).toBe('_markdown/ch-01.md')
  })
})

describe('b-ber-validator: report', () => {
  it('prints the location, the line and a caret under the span', () => {
    const src = '# T\n\n::: chaptr:ch-01\n'
    const [d] = check(src, '_markdown/ch-01.md')
    expect(report(src, d)).toBe(
      [
        '_markdown/ch-01.md:3:5 - warning unknown-name: Unknown directive `chaptr`. Did you mean `chapter`?',
        '  3 | ::: chaptr:ch-01',
        '    |     ^^^^^^',
        '  note: The line is rendered as text',
      ].join('\n')
    )
  })

  it('prints each note with its own excerpt', () => {
    const src = '::: chapter:a\n\n::: chapter:a\n::: exit:a\n'
    const d = check(src, 'x.md').find((x) => x.code === 'duplicate-id')
    expect(report(src, d)).toBe(
      [
        'x.md:3:13 - error duplicate-id: The id `a` is already used',
        '  3 | ::: chapter:a',
        '    |             ^',
        '  note: x.md:1:13: `chapter:a` uses it first',
        '  1 | ::: chapter:a',
        '    |             ^',
      ].join('\n')
    )
  })

  it('widens the gutter for the line number', () => {
    const src = `${'\n'.repeat(11)}::: chapter\n`
    const [d] = check(src, 'x.md')
    expect(report(src, d).split('\n').slice(1)).toEqual([
      '  12 | ::: chapter',
      '     |     ^^^^^^^',
    ])
  })

  it('gives the same line and column for CRLF line ends', () => {
    const lf = '# T\n\n::: chaptr:a\n'
    const crlf = lf.replace(/\n/g, '\r\n')
    expect(report(crlf, check(crlf, 'x.md')[0])).toBe(
      report(lf, check(lf, 'x.md')[0])
    )
  })

  it('colours the location, the severity and the carets when asked', () => {
    const src = '::: chapter\n'
    const [d] = check(src, 'x.md')
    const out = report(src, d, { color: true })
    expect(out).toContain('\x1b[36mx.md:1:5\x1b[0m')
    expect(out).toContain('\x1b[31;1merror\x1b[0m')
    expect(out).toContain('\x1b[31m^^^^^^^\x1b[0m')
    // Without the codes it is the plain report
    const sgr = new RegExp(`${String.fromCharCode(27)}\\[[\\d;]*m`, 'g')
    expect(out.replace(sgr, '')).toBe(report(src, d))
  })
})
