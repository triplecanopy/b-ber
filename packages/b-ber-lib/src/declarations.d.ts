// yawn-yaml 1.5 ships no types
declare module 'yawn-yaml/cjs' {
  class YAWN {
    constructor(yaml: string)
    yaml: string
    // The parsed document. Assigning to it rewrites `yaml`, keeping comments
    json: unknown
  }
  export = YAWN
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
