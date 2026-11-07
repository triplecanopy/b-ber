// Types for the `utils.js` CJS shim. See `State.d.ts` for why this is
// `export =`. `utils` is a namespace, so named imports from this subpath
// (`import { ensure } from '…/utils'`) type-check against its members.
import { utils } from './dist/index.js'

export = utils
