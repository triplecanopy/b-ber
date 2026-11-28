// Structural types for the parts of markdown-it that b-ber's parsers and
// grammars use, shared so that each package does not declare its own.
//
// They are declared here rather than imported from markdown-it because only
// b-ber-markdown-renderer depends on markdown-it. Importing its types anywhere
// else makes tsdown inline all of them (~39 kB) into that package's
// dist/index.d.ts. b-ber-markdown-renderer registers every plugin on a real
// MarkdownIt instance, which is where these are checked against markdown-it's
// own types.

import type GuideItem from './GuideItem'
import type { FootnotesEntry, MediaEntry } from './State'
import type { Target } from './Target'

// A token as the grammars' render rules read it
export interface DirectiveToken {
  // e.g. `container_figure_open`
  type: string
  info: string
  nesting: number
  map: [number, number] | null
}

// A token pushed by b-ber-parser-figure. It stores the caption's markdown
// source on `children`, where markdown-it keeps child tokens
export interface FigureToken extends DirectiveToken {
  children?: string | null
}

// Book-wide footnote numbering: b-ber-parser-footnotes' `Counter`. Under
// `group_footnotes: false` the notes are numbered across the whole book, so
// one is made per build and carries from one document to the next (five
// published books rely on it). `page` is how many documents' footnotes the
// build has collected so far. TASK-166 moves it onto the build context
export interface FootnoteNumbering {
  listCounter(grouped: boolean, page: number): number
  listItemCounter(grouped: boolean, page: number): number
  // Inline notes (`^[…]`) have no label
  setRef(label: string | undefined): string
  getRef(): string
}

// What the build tells the grammars about the document being rendered and the
// book it is in. They read it and never change it. It used to be read from
// `State` (TASK-177)
export interface DocumentInput {
  // The document's file name, without `.md`
  fileName: string
  // Its title in the spine, or else its file name: the notes page's heading
  title: string
  target: Target
  // The path of a file in the project's `_images`
  images(name: string): string
  // The audio and video files in the project's `_media`
  audio: readonly string[]
  video: readonly string[]
  // media.yml: media id, then target name, then the directive it becomes
  media: Readonly<Record<string, Record<string, MediaEntry>>>
  groupFootnotes: boolean
  // How many figures and footnote pages the documents before this one gave:
  // a figure's place in the list of illustrations, and the footnote page
  // `FootnoteNumbering` counts, are book-wide
  figuresBefore: number
  footnotesBefore: number
  footnotes: FootnoteNumbering
}

// What rendering one document collects for the build, in source order. The
// build used to collect it in `State` as each grammar met it
export interface DocumentResult {
  // A page in the list of illustrations for each figure, as b-ber-templates'
  // figure templates take them
  figures: unknown[]
  // The rendered notes. A document's notes are one entry; a caption with a
  // note of its own makes another, as it always has
  footnotes: FootnotesEntry[]
  guide: GuideItem[]
  // The document's front matter, merged into its spine entry
  frontMatter: Record<string, unknown>[]
  // The remote sources of audio and video, for the OPF manifest
  remoteAssets: string[]
}

// The part of markdown-it's `env` that b-ber's grammars and parsers read and
// write: everything per document (TASK-177). Nothing they keep outlives a
// render. A type rather than an interface, so that it is assignable to
// markdown-it's `Env`, an index signature
export type DocumentEnv = {
  document: DocumentInput
  result: DocumentResult
}

// The env for a render inside another: a caption, a gallery item's caption, a
// resolved `media` line. It shares the document and what it collects, and
// nothing markdown-it's own rules keep in `env`, which a nested render always
// started without
export const nestedEnv = (env: DocumentEnv): DocumentEnv => ({
  document: env.document,
  result: env.result,
})

// A figure's place in the book's list of illustrations, if it is added next
export const nextFigure = (env: DocumentEnv): number =>
  env.document.figuresBefore + env.result.figures.length

// The markdown-it instance the grammars render captions with. The env is the
// render's; the instance renders with its nested env
export interface RendererInstance {
  renderInline(src: string, env: DocumentEnv): string
}

// The XHTML a document renders to, built as a tree and serialized once
// (TASK-176), so that every element b-ber writes is closed where it is
// opened. b-ber-markdown-renderer's `xhtml` builds and serializes these. They
// are declared here, with the rest of what the grammars and the renderer
// share, because the grammars cannot depend on the renderer
export type XhtmlNode =
  | XhtmlElement
  | XhtmlText
  | XhtmlRaw
  | XhtmlComment
  | XhtmlFragment

export interface XhtmlElement {
  type: 'element'
  tag: string
  // In the order they are written
  attrs: [string, string][]
  children: XhtmlNode[]
}

// Text, escaped when it is written
export interface XhtmlText {
  type: 'text'
  value: string
}

// Markup written as it is: what markdown-it renders (the document's Markdown,
// a caption), and markup b-ber-templates and b-ber-lib still write as strings
export interface XhtmlRaw {
  type: 'raw'
  html: string
}

export interface XhtmlComment {
  type: 'comment'
  value: string
}

// Nodes written one after another, with nothing around them
export interface XhtmlFragment {
  type: 'fragment'
  children: XhtmlNode[]
}

// What the builder takes as a child: a string is text, and nothing is written
// for null, undefined or false, so that a child can be conditional
export type XhtmlChild = XhtmlNode | string | null | undefined | false

// An element's attributes, in the order they are written. One whose value is
// null, undefined or false is left out
export type XhtmlAttributes =
  | Record<string, string | number | null | undefined | false>
  | [string, string | number][]

// `h(tag, attrs, children)`, TASK-161's element builder, with the other kinds
// of node
export interface XhtmlBuilder {
  (
    tag: string,
    attrs?: XhtmlAttributes | null,
    children?: XhtmlChild[]
  ): XhtmlElement
  text(value: string): XhtmlText
  raw(html: string): XhtmlRaw
  comment(value: string): XhtmlComment
  fragment(children: XhtmlChild[]): XhtmlFragment
}

// How a block closed, as b-ber-markdown-renderer's directive rule decides it:
// at its own `exit`, at an outer block's `exit` that crossed it, or at the end
// of its Markdown container
export type ClosedBy = 'exit' | 'crossed-exit' | 'end'

// A block directive, as its grammar renders it: the directive rule's node
export interface BlockDirective {
  // e.g. `chapter` or `gallery`
  name: string
  id: string
  // The opener's line after the fence, exactly as markdown-it captured it.
  // The grammars parse it themselves, as they always have
  info: string
  // 0-based source line of the opener
  line: number
}

// A single-line directive, as its grammar renders it
export interface InlineDirective {
  // The line after the fence
  info: string
  // 0-based source line
  line: number
  // The caption's Markdown source, between its `::` lines
  caption?: string
}

export interface DirectiveRenderArgs<Node> {
  node: Node
  env: DocumentEnv
  h: XhtmlBuilder
}

// Renders a block directive. It is called at the block's opener, before
// anything inside the block renders, and returns what builds the block once
// its children have. So a grammar warns about an opener's attributes, or
// rejects them, before anything inside renders, as it did when the opener
// rendered on its own, and the build's messages keep their order
export type BlockRender = (
  args: DirectiveRenderArgs<BlockDirective>
) => (children: XhtmlNode[], closedBy: ClosedBy) => XhtmlNode

// Renders a single-line directive
export type InlineRender = (
  args: DirectiveRenderArgs<InlineDirective>
) => XhtmlNode

// What b-ber-markdown-renderer passes to each grammar's `renderer` factory
export interface RendererReference {
  instance: RendererInstance
}

// A markdown-it token, as the parsers create and change it
export interface MarkdownToken {
  type: string
  tag: string
  // markdown-it allows a number as an attribute's value
  attrs: [string, string | number][] | null
  map: [number, number] | null
  nesting: number
  level: number
  // The parsers push literal tokens here carrying only the fields markdown-it's
  // renderer reads, so a child is not guaranteed to be a whole token
  children: Partial<MarkdownToken>[] | null
  content: string
  markup: string
  info: string
  // Whatever the rule that pushed the token stored, e.g. a footnote's id
  meta: unknown
  block: boolean
  hidden: boolean
  attrSet(name: string, value: string): void
  attrPush(attr: [string, string]): void
}

// The fields every markdown-it rule state shares. `Env` is the shape of the
// render's `env`, which plugins use to pass data between rules
interface RuleState<Env> {
  src: string
  env: Env
  tokens: MarkdownToken[]
  level: number
  Token: new (type: string, tag: string, nesting: number) => MarkdownToken
}

// markdown-it's StateBlock, as the block rules read it
export interface BlockState<Env = Record<string, unknown>>
  extends RuleState<Env> {
  bMarks: number[]
  eMarks: number[]
  tShift: number[]
  sCount: number[]
  blkIndent: number
  line: number
  lineMax: number
  parentType: string
  md: {
    block: {
      tokenize(
        state: BlockState<Env>,
        startLine: number,
        endLine: number,
        silent?: boolean
      ): void
    }
  }
  push(type: string, tag: string, nesting: number): MarkdownToken
}

// markdown-it's StateInline, as the inline rules read it
export interface InlineState<Env = Record<string, unknown>>
  extends RuleState<Env> {
  pos: number
  posMax: number
  md: {
    inline: {
      parse(
        src: string,
        md: unknown,
        env: Env,
        outTokens: MarkdownToken[]
      ): void
    }
  }
  push(type: string, tag: string, nesting: number): MarkdownToken
}

// markdown-it's StateCore, as the core rules read it
export type CoreState<Env = Record<string, unknown>> = RuleState<Env>

// The rule types below are what a plugin hands markdown-it, so they have to
// accept markdown-it's own StateBlock, StateInline and StateCore. The state
// interfaces above are only the parts the parsers read, and this file cannot
// check them against markdown-it's types (see the top of the file). So a
// rule's `state` is `unknown` here, and each type is written as a method,
// whose parameters TypeScript checks bivariantly, so that a parser's rule can
// declare the state interface it reads instead.

// A markdown-it block rule
export type BlockRule = {
  method(
    state: unknown,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean
}['method']

// A markdown-it inline rule
export type InlineRule = {
  method(state: unknown, silent: boolean): boolean
}['method']

// A markdown-it core rule
export type CoreRule = { method(state: unknown): void }['method']

// The parts of a MarkdownIt instance that the container parsers register
// themselves on
export interface MarkdownItHost {
  block: {
    ruler: {
      before(
        beforeName: string,
        ruleName: string,
        rule: BlockRule,
        options?: { alt?: string[] }
      ): void
    }
  }
  // Render rules are stored here and called by markdown-it, never read back
  renderer: { rules: Record<string, unknown> }
}

// What a grammar's `renderer` passes to b-ber-parser-section,
// b-ber-parser-dialogue or b-ber-parser-gallery as the plugin's options
export interface ContainerPluginOptions {
  marker?: string
  minMarkers?: number
  // Called with the text after the marker and its line number; a falsy
  // result means the line does not open this container
  validateOpen(params: string, line: number): unknown
  // The markdown-it render rule for the container's open and close tokens
  render: unknown
}

// What a grammar's `renderer` passes to b-ber-parser-figure as the plugin's
// options
export interface FigurePluginOptions {
  // Called with the text after the marker and its line number; a falsy
  // result means the line is not this directive
  validate(params: string, line: number): unknown
  // The markdown-it render rule for the figure's open and close tokens
  render: unknown
}
