// Types for the `sequences.js` CJS shim beside this file, which re-exports one
// member of the bundled entry as `module.exports`. Hence `export =`, not
// `export default`: a consumer's `import sequences from '…/sequences'` goes
// through esModuleInterop and receives the whole module.
import { sequences } from './dist/index.js'

export = sequences
