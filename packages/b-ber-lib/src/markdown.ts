// Structural types for the parts of markdown-it that b-ber's parsers and
// grammars use, shared so that each package does not declare its own.
//
// They are declared here rather than imported from markdown-it because only
// b-ber-markdown-renderer depends on markdown-it. Importing its types anywhere
// else makes tsdown inline all of them (~39 kB) into that package's
// dist/index.d.ts. b-ber-markdown-renderer registers every plugin on a real
// MarkdownIt instance, which is where these are checked against markdown-it's
// own types.

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

// The markdown-it instance the grammars render captions with
export interface RendererInstance {
  renderInline(src: string): string
}

// b-ber-markdown-renderer's MarkdownRenderer, which tracks the file being
// rendered
export interface RendererContext {
  fileName: string
}

// What b-ber-markdown-renderer passes to each grammar's `renderer` factory
export interface RendererReference {
  instance: RendererInstance
  context: RendererContext
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
