import path from 'node:path'
import fs from 'fs-extra'
import MarkdownIt from 'markdown-it'
import markdownItFrontmatter from 'markdown-it-front-matter'
import { directives, formatDiagnostic, locate } from '../src/directives'

// The rule on its own (no old plugins, no b-ber-lib State): the spec's
// behaviour, which TASK-161's tests 1–6 are written against
const md = new MarkdownIt().use(markdownItFrontmatter, () => {}).use(directives)

// markdown-it's own newline normalization, which the spans index into
const normalize = (src) => src.replace(/\r\n?/g, '\n')

const parse = (src) => {
  const env = { file: 'x.md', diagnostics: [] }
  const tokens = md.parse(src, env)
  return { env, tokens, text: normalize(src) }
}

const at = (text, offset) => {
  const { line, column } = locate(text, offset)
  return `${line}:${column}`
}
const range = (text, span) => `${at(text, span.start)}-${at(text, span.end)}`

// A diagnostic as the tests compare it: positions as `line:col-line:col`
const view = (text, d) => ({
  code: d.code,
  severity: d.severity,
  message: d.message,
  span: range(text, d.span),
  notes: (d.notes ?? []).map((n) => ({
    message: n.message,
    ...(n.span ? { span: range(text, n.span) } : {}),
  })),
})

const diagnose = (src) => {
  const { env, text } = parse(src)
  return env.diagnostics.map((d) => view(text, d))
}

// Test 1: one case per code `section` can raise. Each source raises exactly
// the diagnostic listed, with its construct on line 1
const CASES = [
  {
    src: '::: chaptr:a\n',
    code: 'unknown-name',
    severity: 'warning',
    message: 'Unknown directive `chaptr`. Did you mean `chapter`?',
    span: '1:5-1:11',
    notes: [{ message: 'The line is rendered as text' }],
  },
  {
    src: '::: subchapter:a\n\n::: exit:a\n',
    code: 'deprecated-name',
    severity: 'warning',
    message: '`subchapter` is deprecated and is rendered as `chapter`',
    span: '1:5-1:15',
    notes: [],
  },
  {
    src: '::: credits:a\n\n::: exit:a\n',
    code: 'draft-name',
    severity: 'warning',
    message:
      '`credits` is a draft EPUB structural semantic and is rendered as `chapter`',
    span: '1:5-1:12',
    notes: [],
  },
  {
    // With a colon: today's parser leaves the line as text
    src: '::: chapter:\n',
    code: 'missing-id',
    severity: 'error',
    message: '`chapter` needs an id: write `chapter:<id>`',
    span: '1:5-1:13',
    notes: [],
  },
  {
    // Without one: today's parser claims the line, then throws
    src: '::: chapter\n',
    code: 'missing-id',
    severity: 'error',
    message: '`chapter` needs an id: write `chapter:<id>`',
    span: '1:5-1:12',
    notes: [],
  },
  {
    src: '::: chapter:a.b\n\n::: exit:a.b\n',
    code: 'id-characters',
    severity: 'error',
    message: 'The id `a.b` may only contain letters, digits, `_` and `-`',
    span: '1:13-1:16',
    notes: [],
  },
  {
    src: '::: chapter:a\n\n::: exit:a\n\n::: section:a\n\n::: exit:a\n',
    code: 'duplicate-id',
    severity: 'error',
    message: 'The id `a` is already used',
    span: '5:13-5:14',
    notes: [{ message: '`chapter:a` uses it first', span: '1:13-1:14' }],
  },
  {
    src: '::: chapter:a bogus:x\n\n::: exit:a\n',
    code: 'unknown-attribute',
    severity: 'warning',
    message: '`chapter` has no attribute `bogus`; it is ignored',
    span: '1:15-1:22',
    notes: [],
  },
  {
    src: '::: chapter:a classes:x classes:"y z"\n\n::: exit:a\n',
    code: 'duplicate-attribute',
    severity: 'warning',
    message: '`classes` is given twice; the last value is used',
    span: '1:25-1:38',
    notes: [{ message: 'First given here', span: '1:15-1:24' }],
  },
  {
    src: '::: chapter:a classes:\n\n::: exit:a\n',
    code: 'missing-value',
    severity: 'warning',
    message: '`classes` has no value; write `classes:""`',
    span: '1:15-1:23',
    notes: [],
  },
  {
    src: '::: chapter:a title:"open\n\n::: exit:a\n',
    code: 'unterminated-quote',
    severity: 'warning',
    message:
      'The value of `title` opens a quote that is not closed on this line',
    span: '1:21-1:26',
    notes: [],
  },
  {
    src: '::: chapter:a extra\n\n::: exit:a\n',
    code: 'stray-word',
    severity: 'warning',
    message: '`extra` is not an attribute; attributes are written `key:value`',
    span: '1:15-1:20',
    notes: [],
  },
  {
    src: '::: chapter:a title "x"\n\n::: exit:a\n',
    code: 'attribute-form',
    severity: 'warning',
    message: '`title "…"` is ignored; write `title:"…"`',
    span: '1:15-1:24',
    notes: [],
  },
  {
    src: '::: chapter:a\n\nBody\n',
    code: 'unclosed-block',
    severity: 'warning',
    message: '`chapter:a` is never closed; it ends at the end of the file',
    span: '1:1-1:14',
    notes: [{ message: 'Add `::: exit:a`' }],
  },
  {
    src: '::: exit:zzz\n',
    code: 'unmatched-exit',
    severity: 'warning',
    message: '`exit:zzz` matches no open block',
    span: '1:1-1:13',
    notes: [{ message: 'No block is open' }],
  },
  {
    src: '::: chapter:a\n\n::: section:b\n\n::: exit:a\n',
    code: 'crossed-exit',
    severity: 'warning',
    message:
      '`exit:a` also closes `section:b`, which is still open inside `chapter:a`',
    span: '5:1-5:11',
    notes: [
      {
        message: '`section:b` opens here; add `::: exit:b`',
        span: '3:1-3:14',
      },
    ],
  },
  {
    src: '::: exit\n',
    code: 'exit-missing-id',
    severity: 'error',
    message: '`exit` needs the id of the block it closes',
    span: '1:5-1:9',
    notes: [],
  },
  {
    src: '::: chapter:a\n\n::: exit:a done\n',
    code: 'exit-trailing-text',
    severity: 'warning',
    message: 'The text `done` after `exit:a` is ignored',
    span: '3:12-3:16',
    notes: [],
  },
]

const expected = ({ code, severity, message, span, notes }) => ({
  code,
  severity,
  message,
  span,
  notes,
})

// Moves `line:col-line:col` down by `lines`
const shift = (spanText, lines) =>
  spanText.replace(/(\d+):(\d+)/g, (_, l, c) => `${Number(l) + lines}:${c}`)

describe('directive diagnostics: one per code (test 1)', () => {
  it.each(CASES.map((c) => [c.code, c]))('%s', (_, c) => {
    expect(diagnose(c.src)).toEqual([expected(c)])
  })

  it('covers every code the structural blocks can raise', () => {
    expect(new Set(CASES.map((c) => c.code)).size).toBe(17)
  })
})

describe('directive diagnostics: anchoring', () => {
  // Test 2: 5 lines of text, then the case nested 2 blocks deep. The text is
  // a paragraph the first opener interrupts, as in TASK-153's defect
  const PREFIX =
    'one\ntwo\nthree\nfour\nfive\n::: chapter:shift-1\n::: section:shift-2\n'
  const PREFIX_LINES = 7

  it.each(CASES.map((c) => [c.code, c]))(
    '%s: shift invariance (test 2)',
    (_, c) => {
      const { env, text } = parse(PREFIX + c.src)
      const ownCase = env.diagnostics.filter(
        (d) => d.span.start >= PREFIX.length && d.code === c.code
      )
      expect(ownCase).toHaveLength(1)
      const [d] = ownCase
      expect(range(text, d.span)).toBe(shift(c.span, PREFIX_LINES))
      // A note keeps its anchor; one with no span may gain one, now that
      // blocks are open around the case
      c.notes.forEach((note, k) => {
        if (note.span)
          expect(range(text, d.notes[k].span)).toBe(
            shift(note.span, PREFIX_LINES)
          )
      })
    }
  )

  // Test 3: on line 1 (the cases above) and straight after front matter
  it.each(CASES.map((c) => [c.code, c]))(
    '%s: after front matter (test 3)',
    (_, c) => {
      const got = diagnose(`---\ntitle: T\n---\n${c.src}`)
      expect(got).toEqual([
        {
          ...expected(c),
          span: shift(c.span, 3),
          notes: c.notes.map((n) =>
            n.span ? { ...n, span: shift(n.span, 3) } : n
          ),
        },
      ])
    }
  )

  // Test 6: CRLF gives the same lines and columns
  it.each(CASES.map((c) => [c.code, c]))('%s: CRLF (test 6)', (_, c) => {
    expect(diagnose(c.src.replace(/\n/g, '\r\n'))).toEqual([expected(c)])
  })
})

// Test 4: over every case and fixture, a span is never empty or blank, starts
// at 0 or at the end only when its construct does, and begins with what the
// message names
describe('directive diagnostics: no boundary carets (test 4)', () => {
  const kitchenSink = path.join(
    __dirname,
    '../../b-ber-testing/fixtures/kitchen-sink/_project/_markdown'
  )
  const sources = [
    ...CASES.flatMap((c) => [c.src, `one\n\n${c.src}`]),
    fs.readFileSync(path.join(__dirname, 'fixtures/document.md'), 'utf8'),
    ...fs
      .readdirSync(kitchenSink)
      .map((f) => fs.readFileSync(path.join(kitchenSink, f), 'utf8')),
  ]

  const named = (message) =>
    [...message.matchAll(/`([^`]+)`/g)].map((m) => m[1].split(/[\s:"]/)[0])

  it.each(sources.map((s, i) => [i, s]))('source %i', (_, src) => {
    const { env, text } = parse(src)
    for (const d of env.diagnostics) {
      for (const span of [d.span, ...(d.notes ?? []).map((n) => n.span)]) {
        if (!span) continue
        const slice = text.slice(span.start, span.end)
        expect(span.end).toBeGreaterThan(span.start)
        expect(slice.trim()).not.toBe('')
        expect(span.start).toBeLessThan(text.length)
        expect(/\s/.test(slice[0])).toBe(false)
      }
      const head = text
        .slice(d.span.start, d.span.end)
        .replace(/^:+\s*/, '')
        .replace(/^["']/, '')
      if (d.code !== 'unterminated-quote') {
        expect(named(d.message).some((w) => w && head.startsWith(w))).toBe(true)
      }
    }
  })
})

// Test 5: one file with one instance of every code reports all of them, in
// source order
describe('directive diagnostics: all problems reported (test 5)', () => {
  const src = [
    '::: chaptr:u',
    '::: credits:c1',
    '::: exit:c1',
    '::: subchapter:s1 bogus:x',
    '::: exit:s1',
    '::: chapter:',
    '::: chapter:a.b classes:x classes:y',
    '::: exit:a.b',
    '::: chapter:c1',
    '::: exit:c1',
    '::: section:m classes:',
    '::: exit:m',
    '::: section:w extra',
    '::: exit:w',
    '::: section:f title "x"',
    '::: exit:f',
    '::: section:q title:"open',
    '::: exit:q',
    '::: exit:zzz',
    '::: chapter:o1',
    '::: section:o2',
    '::: exit:o1',
    '::: exit',
    '::: chapter:t',
    '::: exit:t trailing',
    '::: chapter:open',
    '',
  ].join('\n')

  it('reports every code once, in order', () => {
    const { env, text } = parse(src)
    expect(
      env.diagnostics.map((d) => `${at(text, d.span.start)} ${d.code}`)
    ).toEqual([
      '1:5 unknown-name',
      '2:5 draft-name',
      '4:5 deprecated-name',
      '4:19 unknown-attribute',
      '6:5 missing-id',
      '7:13 id-characters',
      '7:27 duplicate-attribute',
      '9:13 duplicate-id',
      '11:15 missing-value',
      '13:15 stray-word',
      '15:15 attribute-form',
      '17:21 unterminated-quote',
      '19:1 unmatched-exit',
      '22:1 crossed-exit',
      '23:5 exit-missing-id',
      '25:12 exit-trailing-text',
      '26:1 unclosed-block',
    ])
  })
})

describe('directive structure', () => {
  const types = (tokens) =>
    tokens
      .filter((t) => t.type.startsWith('directive_'))
      .map((t) => `${t.type}${t.info ? ` ${t.info.trim()}` : ''}`)

  it('pairs a block with its exit', () => {
    const { tokens } = parse('::: chapter:a\n\nx\n\n::: exit:a\n')
    expect(types(tokens)).toEqual([
      'directive_open chapter:a',
      'directive_close',
      'directive_exit exit:a',
      'directive_end exit:a',
      'directive_end chapter:a',
    ])
  })

  it('closes the inner blocks at a crossed exit, then the named one', () => {
    const { tokens } = parse(
      '::: chapter:a\n\n::: section:b\n\n::: exit:a\n\n::: exit:b\n'
    )
    const closes = tokens
      .filter((t) => t.type === 'directive_close')
      .map((t) => t.meta.directive.id)
    expect(closes).toEqual(['b', 'a'])
    // `exit:b` no longer matches anything
    expect(
      parse(
        '::: chapter:a\n\n::: section:b\n\n::: exit:a\n\n::: exit:b\n'
      ).env.diagnostics.map((d) => d.code)
    ).toEqual(['crossed-exit', 'unmatched-exit'])
  })

  it('closes a block left open in a list item at the end of the item', () => {
    const { env, tokens } = parse('- item\n\n  ::: section:in\n\n  text\n')
    const i = tokens.findIndex((t) => t.type === 'directive_close')
    expect(tokens[i + 1].type).toBe('directive_end')
    expect(tokens[i + 2].type).toBe('list_item_close')
    expect(env.diagnostics[0].message).toBe(
      '`section:in` is never closed; it ends at the end of the list item at line 1'
    )
  })

  it('does not see a directive inside fenced code', () => {
    expect(diagnose('```\n::: chaptr:a\n::: exit:zzz\n```\n')).toEqual([])
  })

  it('interrupts a paragraph without reporting the id twice (TASK-153)', () => {
    const { env, tokens } = parse('para\n::: section:b\n\nbody\n\n::: exit:b\n')
    expect(env.diagnostics).toEqual([])
    expect(tokens.map((t) => t.type)).toContain('directive_open')
  })

  it('lifts the tokens into a tree', () => {
    const { env } = parse(
      '::: chapter:a classes:x\n\n::: section:b\n\nbody\n\n::: exit:b\n\n::: exit:a\n'
    )
    const [chapter] = env.tree.children
    expect(chapter).toMatchObject({
      type: 'directive',
      name: 'chapter',
      id: 'a',
      attrs: { classes: 'x' },
    })
    const section = chapter.children.find((n) => n.type === 'directive')
    expect(section).toMatchObject({ name: 'section', id: 'b' })
    expect(section.children.map((n) => n.type)).toEqual(['paragraph'])
  })

  it('makes pullquote and blockquote nodes, with their content (TASK-175)', () => {
    const { env, tokens } = parse(
      '::: chapter:a\n\n::: pullquote:p citation:"Someone"\n\nquoted\n\n::: exit:p\n\n::: blockquote:q\n\nmore\n\n::: exit:q\n\n::: exit:a\n'
    )
    expect(env.diagnostics).toEqual([])
    const [chapter] = env.tree.children
    const blocks = chapter.children.filter((n) => n.type === 'directive')
    expect(blocks).toMatchObject([
      { name: 'pullquote', id: 'p', attrs: { citation: 'Someone' } },
      { name: 'blockquote', id: 'q' },
    ])
    expect(blocks[0].children.map((n) => n.type)).toEqual(['paragraph'])
    const families = tokens
      .filter((t) => t.type === 'directive_open')
      .map((t) => t.meta.family)
    expect(families).toEqual(['section', 'pullquote', 'pullquote'])
  })

  it('makes a dialogue node and marks its speaker lines (TASK-175)', () => {
    const { env, tokens } = parse(
      '::: dialogue:d\n\n:: Ann :: Hello.\n\n::: exit:d\n'
    )
    expect(env.diagnostics).toEqual([])
    expect(env.tree.children[0]).toMatchObject({
      type: 'directive',
      name: 'dialogue',
      id: 'd',
    })
    const paragraph = tokens.find((t) => t.type === 'paragraph_open')
    expect(paragraph.attrGet('class')).toBe('interlocutor-parent')
    const line = tokens.find((t) => t.type === 'inline')
    expect(line.content).toBe(' Hello.')
    expect(line.children[0].attrs).toEqual([['class', 'interlocutor']])
  })

  // The dialogue's tokens hold the rest of its range, and a speaker line
  // anywhere after it used to be marked too (TASK-161)
  it('leaves a speaker line after the dialogue’s exit as text', () => {
    const { tokens } = parse(
      '::: dialogue:d\n\n:: Ann :: Hello.\n\n::: exit:d\n\n:: Bob :: Not dialogue.\n'
    )
    const lines = tokens.filter((t) => t.type === 'inline')
    expect(lines.map((t) => t.content)).toEqual([
      ' Hello.',
      ':: Bob :: Not dialogue.',
    ])
    const paragraphs = tokens.filter((t) => t.type === 'paragraph_open')
    expect(paragraphs.map((t) => t.attrGet('class'))).toEqual([
      'interlocutor-parent',
      null,
    ])
  })

  it('makes gallery and spread nodes, and runs their afterBlock hooks (TASK-175)', () => {
    const seen = []
    const withHooks = new MarkdownIt().use(directives, {
      afterBlock: {
        gallery: (state) => seen.push(['gallery', { ...state.tokens.at(-1) }]),
        spread: (state) => seen.push(['spread', { ...state.tokens.at(-1) }]),
      },
    })
    const env = { file: 'x.md', diagnostics: [] }
    withHooks.parse(
      '::: gallery:g\n\n:: type:image source:a.png ::\n\n::: exit:g\n\n::: spread:s\n\nx\n\n::: exit:s\n',
      env
    )
    expect(env.diagnostics).toEqual([])
    // Paired by their exits, they are siblings in the tree
    expect(
      env.tree.children
        .filter((n) => n.type === 'directive')
        .map(({ name, id }) => `${name}:${id}`)
    ).toEqual(['gallery:g', 'spread:s'])
    // The spread's tokens are inside the gallery's range, as the old parser
    // shaped them, so its hook runs first, when its own tokens are complete
    expect(seen.map(([name]) => name)).toEqual(['spread', 'gallery'])
    for (const [name, last] of seen) {
      expect(last.type).toBe('directive_line_close')
      expect(last.meta.family).toBe(name)
    }
  })

  describe('single-line directives (TASK-175)', () => {
    const withFigures = new MarkdownIt().use(directives, {
      inline: [
        {
          family: 'figure',
          validate: (params) => /^figure:/.test(params.trim()),
          render: ({ node, h }) =>
            h.raw(`<figure>${node.caption ?? ''}</figure>`),
        },
      ],
    })
    const parseFigures = (src) => {
      const env = { file: 'x.md', diagnostics: [] }
      return { env, tokens: withFigures.parse(src, env) }
    }

    it('makes an inline node with its caption', () => {
      const { env } = parseFigures(
        '::: figure:f source:a.png\n:: A *caption*\n::\n\nAfter.\n'
      )
      expect(env.tree.children[0]).toMatchObject({
        type: 'directive',
        name: 'figure',
        id: 'f',
        inline: true,
        attrs: { source: 'a.png' },
        caption: ' A *caption*\n',
      })
      expect(env.tree.children[1].type).toBe('paragraph')
    })

    it('renders with the grammar, from the open token the old parser made', () => {
      expect(
        withFigures.render('::: figure:f source:a.png\n:: Cap\n::\n')
      ).toBe('<figure> Cap\n</figure>')
    })

    // b-ber-parser-figure took the next line starting `::` as a caption, and a
    // `:::` line starts with `::` (TASK-161 bug 11): `b` opened a caption and
    // `c` closed it, so neither rendered
    it('does not take the next directive lines as a caption', () => {
      const { tokens } = parseFigures(
        '::: figure:a source:a.png\n::: figure:b source:b.png\n::: figure:c source:c.png\n'
      )
      const inline = tokens.filter((t) => t.type === 'directive_inline')
      expect(inline.map((t) => t.meta.directive.id)).toEqual(['a', 'b', 'c'])
      expect(inline.map((t) => t.meta.caption)).toEqual([
        undefined,
        undefined,
        undefined,
      ])
    })

    it('still takes a caption between two `::` lines after a directive', () => {
      const { tokens } = parseFigures(
        '::: figure:a source:a.png\n:: Cap\n::\n::: figure:b source:b.png\n'
      )
      const inline = tokens.filter((t) => t.type === 'directive_inline')
      expect(inline.map((t) => t.meta.caption)).toEqual([' Cap\n', undefined])
    })
  })

  // A block is one element, built by its family's render from its node and
  // its rendered children. The render is called at the opener, and builds
  // once the children have rendered, so what it does comes in source order
  it('builds each block whole, at its node (TASK-176)', () => {
    const calls = []
    const withBlocks = new MarkdownIt().use(directives, {
      blocks: {
        section: ({ node, h }) => {
          calls.push(`open ${node.id}`)
          return (children, closedBy) => {
            calls.push(`build ${node.id} ${closedBy}`)
            return h('div', { id: node.id }, children)
          }
        },
      },
    })
    expect(
      withBlocks.render('::: chapter:a\n\n::: section:b\n\nx\n\n::: exit:a\n')
    ).toBe('<div id="a"><div id="b"><p>x</p>\n</div></div>')
    expect(calls).toEqual([
      'open a',
      'open b',
      'build b crossed-exit',
      'build a exit',
    ])
  })

  it('renders plain sections without a legacy renderer', () => {
    expect(md.render('::: chapter:a\n\nx\n\n::: exit:a\n')).toBe(
      '<section id="a"><p>x</p>\n</section>'
    )
  })
})

describe('formatDiagnostic', () => {
  it('prints the location, the line and a caret under the span', () => {
    const src = '# T\n\n::: chaptr:ch-01\n'
    const { env, text } = parse(src)
    expect(formatDiagnostic(text, env.diagnostics[0])).toBe(
      [
        'x.md:3:5 - warning unknown-name: Unknown directive `chaptr`. Did you mean `chapter`?',
        '  3 | ::: chaptr:ch-01',
        '    |     ^^^^^^',
        '  note: The line is rendered as text',
      ].join('\n')
    )
  })
})
