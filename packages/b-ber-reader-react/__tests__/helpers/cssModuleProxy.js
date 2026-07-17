// Jest stand-in for CSS Module imports (`import styles from './x.module.css'`).
// The real bundler returns an object mapping local class names to scoped
// (hashed) strings; in tests we don't need real hashes, so return the key
// itself — `styles.spinner` → 'spinner'. `__esModule` returns false so the
// CommonJS interop wraps this proxy as the default export.
module.exports = new Proxy(
  {},
  { get: (_target, key) => (key === '__esModule' ? false : key) }
)
