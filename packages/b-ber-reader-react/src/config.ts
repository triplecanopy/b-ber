// This package's tsconfig targets the DOM lib without Node types, so `module`
// is declared locally. The SWC test transform (module: commonjs) compiles the
// assignment below to a CommonJS export, matching the original file's shape.
declare const module: { exports: unknown }

interface ReaderConfig {
  debug: boolean
  showBreakoints: boolean
  showGrid: boolean
  logTime: boolean
  useLocalStorage: boolean
  verboseOutput: boolean
}

const config: ReaderConfig = {
  debug: false, // Colorizes elements. Useful for work on spreads/markers
  showBreakoints: false, // Show breakpoints debugger
  showGrid: false, // Show grid overlay
  logTime: false, // Show console.time
  useLocalStorage: true, // Load/save data from localStorage
  verboseOutput: false, // Logging level
}

// Preserve the original `module.exports = {...}` CommonJS shape so
// `require('../src/config')` yields the object directly (no `.default`). The
// SWC test transform compiles this to a plain CommonJS export.
module.exports = config
