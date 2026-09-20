// Read straight from package.json so there is exactly one source of truth. This
// is a browser bundle, so the version cannot be read at runtime the way the
// Node-side packages do (b-ber-lib's State reads its own package.json with
// fs); bundlers inline the named import at build time instead.
import { version } from '../../package.json'

export default version
