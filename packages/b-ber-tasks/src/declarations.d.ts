declare module 'layouts' {
  import VinylFile from 'vinyl'

  function renderLayouts(
    file: VinylFile,
    layouts: Record<string, VinylFile>
  ): VinylFile
  export = renderLayouts
}

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

declare module 'autoprefixer' {
  import { AcceptedPlugin } from 'postcss'

  interface AutoprefixerOptions {
    overrideBrowserslist?: string[]
    flexbox?: string | boolean
    [key: string]: unknown
  }
  function autoprefixer(options?: AutoprefixerOptions): AcceptedPlugin
  export = autoprefixer
}
