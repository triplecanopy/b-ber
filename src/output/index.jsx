
/**
 * @module index
 */

// output
export { default as clean } from 'output/clean'
export { default as config } from 'lib/config'
export { default as copy } from 'output/copy'
export { default as create } from 'output/create'
export { default as deploy } from 'output/deploy'
export { default as init } from 'output/init'
export { default as opf } from 'output/opf'
export { default as publish } from 'output/publish'
export { default as render } from 'output/render'
export { default as site } from 'output/site'
export { default as loi } from 'output/loi'
export { default as epub } from 'output/epub'
export { default as xml } from 'output/xml'
export { default as Generate } from 'output/generate'
// TODO: Editor causes b-ber-creator to hang (doesn't exit).
// export { default as editor } from 'output/editor'

// nested
export { default as mobi } from 'output/mobi'
// export { default as mobiCSS } from 'output/mobi/mobi-css' // should be called from `mobi` task
export { default as web } from 'output/web'
export { default as sample } from 'output/sample'
export { default as pdf } from 'output/pdf'

// lib
export { default as theme } from 'lib/theme'
export { default as serve } from 'lib/serve'
// export { default as watch } from 'lib/watch'

// modifiers
export { default as inject } from 'modifiers/inject'
export { default as sass } from 'modifiers/sass'
export { default as scripts } from 'modifiers/scripts'

// plugins
export { default as md } from 'plugins/md'
