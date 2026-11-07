// Types for the `State.js` CJS shim beside this file, which re-exports one
// member of the bundled entry as `module.exports`. Hence `export =`, not
// `export default`: a consumer's `import state from '…/State'` goes through
// esModuleInterop and receives the whole module. Every root shim has one of
// these; add both together.
import { State } from './dist/index.js'

export = State
