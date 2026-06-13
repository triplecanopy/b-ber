// Ambient module declarations for runtime dependencies that ship no types and
// have no @types package. Kept minimal — only the surface this package uses.
// TODO: tighten these as the consuming call sites are typed.

declare module 'js-string-escape' {
  export default function jsStringEscape(str: unknown): string
}

declare module 'quote' {
  export default function quote(value: unknown): string
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

// Side-effect-only polyfills (imported for their global registration).
declare module 'object-fit-images'
declare module 'url-search-params-polyfill'
