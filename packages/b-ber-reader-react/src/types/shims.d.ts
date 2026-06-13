// Ambient module declarations for runtime dependencies that ship no types and
// have no @types package. Kept minimal — only the surface this package uses.
// TODO: tighten these as the consuming call sites are typed.

declare module 'js-string-escape' {
  export default function jsStringEscape(str: unknown): string
}

declare module 'quote' {
  interface QuoteOptions {
    quotes: string
  }
  // Called with an options object, `quote` returns a configured quoting
  // function; called with a value, it quotes that value directly.
  function quote(options: QuoteOptions): (value: unknown) => string
  function quote(value: unknown): string
  export default quote
}

declare module 'react-attr-converter' {
  // Maps an HTML attribute name to its React prop equivalent (e.g. class →
  // className). Returns the original name when there is no mapping.
  export default function convert(attr: string): string
}

declare module 'html-to-react' {
  // html-to-react is loosely typed by design (it walks arbitrary parsed DOM
  // nodes). The node/instruction shapes are `any` here; call sites narrow.
  export class Parser {
    parseWithInstructions(
      html: string,
      isValidNode: (node: any) => boolean,
      processingInstructions: any[],
      preprocessingInstructions?: any[]
    ): React.ReactNode
    parse(html: string): React.ReactNode
  }
  export class ProcessNodeDefinitions {
    constructor(react?: unknown)
    processDefaultNode(node: any, children: any, index: number): React.ReactNode
  }
  export const IsValidNodeDefinitions: { alwaysValid(): boolean }
}

// css-tree exposes its parser/generator/walker/utils as subpath entry points
// with no bundled types. The AST nodes are walked dynamically, so the surface
// here is `any`. TODO: adopt @types/css-tree if/when it covers these subpaths.
declare module 'css-tree/parser' {
  export default function parse(css: string, options?: any): any
}
declare module 'css-tree/generator' {
  export default function generate(node: any, options?: any): string
}
declare module 'css-tree/walker' {
  export default function walk(ast: any, options: any): void
}
declare module 'css-tree/utils' {
  export const List: {
    createItem(data: any): any
    [key: string]: any
  }
}

// Side-effect-only polyfills (imported for their global registration).
declare module 'object-fit-images'
declare module 'url-search-params-polyfill'

// Style imports are handled by Vite, not tsc; declare them so side-effect
// imports (`import './index.scss'`) typecheck.
declare module '*.css'
declare module '*.scss'
