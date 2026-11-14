// htmlparser2 3.x ships no types; 4 onwards does, but changes entity decoding.
// TypeScript used to borrow the types of an unrelated htmlparser2 8 that npm
// happened to hoist to the root, so nothing failed until the hoisting changed
declare module 'htmlparser2' {
  interface Handler {
    onopentag(name: string, attributes: Record<string, string>): void
    ontext(text: string): void
    onclosetag(name: string): void
    onend(): void
  }
  interface ParserOptions {
    decodeEntities?: boolean
  }
  class Parser {
    constructor(handler: Partial<Handler>, options?: ParserOptions)
    write(chunk: string): void
    end(): void
  }

  export { Parser }
}

// layouts 3.x ships no types. Kept identical to b-ber-tasks' declaration:
// each package compiles on its own, so the two cannot share one file
declare module 'layouts' {
  import File from 'vinyl'

  // `layouts` maps a layout name to a vinyl file whose `contents` is the layout
  function renderLayouts(file: File, layouts: Record<string, File>): File
  export = renderLayouts
}

// command-exists 1.2 ships no types. @types/command-exists exists, but a
// dependency is not worth it for the one signature called here
declare module 'command-exists' {
  function exists(
    cmd: string,
    callback: (err: Error | null, exists: boolean) => void
  ): void
  export = exists
}
