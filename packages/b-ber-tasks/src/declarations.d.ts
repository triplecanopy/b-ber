declare module 'layouts' {
  import VinylFile from 'vinyl'

  function renderLayouts(
    file: VinylFile,
    layouts: Record<string, string>
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

// b-ber-templates subpath stubs — inline declarations so BufferFile return
// types don't conflict with Template.render(string, string) call sites
declare module '@canopycanopycanopy/b-ber-templates/Xhtml' {
  class Xhtml {
    static head(): any
    static body(): any
    static tail(): any
    static cover(opts: {
      width?: number
      height?: number
      href: string
    }): string
    static stylesheet(inline?: boolean): any
    static javascript(inline?: boolean): any
    static jsonLD(): any
    static loi(): string
  }
  export default Xhtml
}

declare module '@canopycanopycanopy/b-ber-templates/Toc' {
  class Toc {
    static body(): any
    static item(data: any): string
    static items(data: any): string
  }
  export default Toc
}

declare module '@canopycanopycanopy/b-ber-templates/Ncx' {
  class Ncx {
    static head(): string
    static title(): string
    static author(): string
    static document(): any
    static navPoint(data: any): string
    static navPoints(data: any): any
  }
  export default Ncx
}

declare module '@canopycanopycanopy/b-ber-templates/Xml' {
  export { Xml as default } from '@canopycanopycanopy/b-ber-templates'
}

declare module '@canopycanopycanopy/b-ber-templates/Project' {
  export { Project as default } from '@canopycanopycanopy/b-ber-templates'
}

declare module '@canopycanopycanopy/b-ber-templates/Opf/Metadata' {
  class Metadata {
    static uid(): string
    static body(): any
    static meta(data: any): string
  }
  export default Metadata
}

declare module '@canopycanopycanopy/b-ber-templates/Opf/Manifest' {
  class Manifest {
    static body(): any
    static item(file: any): string
  }
  export default Manifest
}

declare module '@canopycanopycanopy/b-ber-templates/Opf/Pkg' {
  class Pkg {
    static body(): any
  }
  export default Pkg
}

declare module '@canopycanopycanopy/b-ber-templates/Opf/Spine' {
  class Spine {
    static body(): any
    static item(data: any): string
    static items(data: any): any
  }
  export default Spine
}

declare module '@canopycanopycanopy/b-ber-templates/Opf/Guide' {
  class Guide {
    static body(): any
    static item(data: any): string
    static items(data: any): any
  }
  export default Guide
}

declare module '@canopycanopycanopy/b-ber-templates/figures' {
  function figure(data: Record<string, any>, build: string): string
  export default figure
}

// Untyped internal packages
declare module '@canopycanopycanopy/b-ber-resources' {
  function getAssets(): Promise<Record<string, string>>
  export default getAssets
}

declare module '@canopycanopycanopy/b-ber-validator' {
  interface ValidatorInput {
    text: string
    index: number
  }
  interface ValidatorResult {
    success: boolean
    [key: string]: unknown
  }
  function validator(input: ValidatorInput): ValidatorResult
  function report(filename: string, result: ValidatorResult): void

  export { report }
  export default validator
}
