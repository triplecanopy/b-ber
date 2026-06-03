declare module 'yawn-yaml/cjs' {
  class YAWN {
    constructor(yaml: string)
    yaml: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json: any
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
