// Globals for the root Jest run.
//
// The root config runs every package under jsdom, because b-ber-reader-react
// needs it. jsdom does not provide TextEncoder/TextDecoder, which Node and
// every browser do. Node-side code that relies on them — image-size, via
// b-ber-lib's getImageDimensions, builds a TextDecoder when it loads — then
// fails to import here although it works in production and in each package's
// own (node environment) Jest run. Hand jsdom Node's implementations.
const { TextDecoder, TextEncoder } = require('node:util')

if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder
