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

// A markdown-it block rule. Its first argument is markdown-it's StateBlock,
// which the parsers read dynamically, so the parsers type it rather than this
// declaration
export type BlockRule = (
  state: unknown,
  startLine: number,
  endLine: number,
  silent: boolean
) => boolean

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
