declare module 'yawn-yaml/cjs' {
  class YAWN {
    constructor(yaml: string)
    yaml: string
    // The parsed document. Assigning to it rewrites `yaml`, keeping comments
    json: unknown
  }
  export = YAWN
}

declare module 'layouts' {
  import File from 'vinyl'

  function renderLayouts(file: File, layouts: Record<string, unknown>): File
  export = renderLayouts
}

declare module 'command-exists' {
  function exists(
    cmd: string,
    callback: (err: Error | null, exists: boolean) => void
  ): void
  export = exists
}
