// Minimal declarations for the dependencies that ship no types, of only what
// this package calls. Ambient declarations are not part of tsdown's
// declaration build, so an exported signature must not infer its type from
// one of these: annotate it, or it is emitted as `any`.

// layouts 3.x. Kept identical to b-ber-lib's declaration: each package
// compiles on its own, so the two cannot share one file
declare module 'layouts' {
  import File from 'vinyl'

  // `layouts` maps a layout name to a vinyl file whose `contents` is the layout
  function renderLayouts(file: File, layouts: Record<string, File>): File
  export = renderLayouts
}

// epub-zipper 1.4
declare module 'epub-zipper' {
  interface ZipperOptions {
    input: string
    output: string
    clean: boolean
    fileName: string
  }
  const zipper: {
    create(options: ZipperOptions): Promise<void>
  }
  export = zipper
}

// pureimage 0.1
declare module 'pureimage' {
  interface Canvas2DContext {
    fillStyle: string
    font: string
    fillRect(x: number, y: number, width: number, height: number): void
    fillText(text: string, x: number, y: number): void
    measureText(text: string): { width: number }
  }
  interface PureImageBitmap {
    getContext(type: '2d'): Canvas2DContext
  }
  interface FontLoader {
    load(callback: () => void): void
  }
  function make(width: number, height: number): PureImageBitmap
  function registerFont(path: string, name: string): FontLoader
  function encodeJPEGToStream(
    bitmap: PureImageBitmap,
    stream: NodeJS.WritableStream
  ): Promise<void>
}

// css 2.2. @types/css exists but is not versioned against css; these are the
// fields mobi-css reads
declare module 'css' {
  interface Declaration {
    type: 'declaration'
    property: string
    value: string
  }
  interface Rule {
    type: string
    selectors?: string[]
    declarations?: Declaration[]
    [key: string]: unknown
  }
  interface Stylesheet {
    rules: Rule[]
  }
  interface AST {
    stylesheet: Stylesheet
  }
  function parse(cssText: string, options?: object): AST
  function stringify(ast: AST, options?: object): string

  export type { AST, Declaration, Rule, Stylesheet }
  export { parse, stringify }
}
