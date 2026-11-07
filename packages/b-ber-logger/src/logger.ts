import type log from './index'

// The type of the logger instance, which is the `this` of every function
// `index.ts` binds onto it. A type-only module so those functions can name it
// without `index.ts` gaining an export, which would change its CommonJS shape.
export type Logger = typeof log
