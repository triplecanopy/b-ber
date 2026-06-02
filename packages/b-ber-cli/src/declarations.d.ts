declare module '@canopycanopycanopy/b-ber-lib/State' {
  const state: any
  export default state
}

declare module '@canopycanopycanopy/b-ber-lib/utils' {
  export const fail: (...args: any[]) => any
  export const ensure: (...args: any[]) => Promise<any>
}

declare module '@canopycanopycanopy/b-ber-lib/YamlAdaptor' {
  const YamlAdaptor: any
  export default YamlAdaptor
}

declare module '@canopycanopycanopy/b-ber-lib/Theme' {
  const Theme: any
  export default Theme
}

declare module '@canopycanopycanopy/b-ber-shapes-sequences/create-build-sequence' {
  const createBuildSequence: (...args: any[]) => any
  export default createBuildSequence
}

declare module '@canopycanopycanopy/b-ber-shapes-sequences/sequences' {
  const sequences: Record<string, any[]>
  export default sequences
}

declare module '@canopycanopycanopy/b-ber-templates/Project' {
  const Project: any
  export default Project
}
