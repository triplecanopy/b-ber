
import { entries } from 'bber-utils'
import { log } from 'bber-plugins'
import { BLOCK_DIRECTIVES, INLINE_DIRECTIVES, MISC_DIRECTIVES } from 'bber-shapes/directives'

const _applyTransforms = (k, v) => {
  switch (k) {
    case 'classes':
      return ` class="${v}"`
    case 'epubTypes':
      return ` epub:type="${v}"`
    case 'pagebreak':
      return ` style="page-break-${v}:always;"`
    case 'attrs':
      return ''
    case 'source':
      return ` src="${v}"`
    case 'autoplay':
    case 'loop':
    case 'controls':
    case 'muted':
      return ` ${k}="${k}"`
    case 'alt':
    default:
      return ` ${k}="${v}"`
  }
}

const _lookUpFamily = (genus) => {
  switch (genus) {
    case 'halftitlepage':
    case 'titlepage':
    case 'dedication':
    case 'epigraph':
    case 'foreword':
    case 'preface':
    case 'acknowledgments':
      return 'frontmatter'
    case 'introduction':
    case 'prologue':
    case 'chapter':
    case 'subchapter':
    case 'epilogue':
    case 'afterword':
    case 'conclusion':
      return 'bodymatter'
    case 'loi':
    case 'appendix':
    case 'seriespage':
    case 'credits':
    case 'contributors':
    case 'colophon':
      return 'backmatter'
    default:
      return ''
  }
}

const supportedAttributes = ['title', 'classes', 'pagebreak', 'attributes',
  'alt', 'poster', 'autoplay', 'loop', 'controls', 'muted', 'autoplay',
  'loop', 'controls', 'muted', 'citation', 'source']

// ::: directive:id classes:"foo bar baz" page-break-before:yes
// <- ' classes:"foo bar baz" page-break-before:yes'

// -> [foo:bar, baz:qux]
const _extractAttrs = str =>
  str.split(/([\w-]+:['"][^'"]+['"]|[\w-]+\w[^\s]+)/)
  .map(_ => _.trim())
  .filter(Boolean)

// -> { foo: 'bar', baz: 'qux' }
const _buildAttrObjects = (arr) => {
  const o = {}
  arr.forEach((_) => {
    const [, k, v] = _.split(/^([^:]+):/)
    o[k] = v.replace(/(?:^["']|["']$)/g, '')
  })
  return o
}

// -> foo="bar" baz="qux"
const _buildAttrString = (obj) => {
  let s = ''
  for (const [k, v] of entries(obj)) {
    s += _applyTransforms(k, v)
  }
  return s
}

/**
 * Determine the directive's classification and parent's type
 * @param  {String} name [description]
 * @return {Object<String>}
 */
const _getDirectiveTaxonomy = (name) => {
  // Class    -> Order  -> Family       -> Genus
  // element  -> block  -> frontmatter  -> preface
  let index
  let order
  let genus
  if ((index = BLOCK_DIRECTIVES.indexOf(name)) > -1) {
    order = 'block'
    genus = BLOCK_DIRECTIVES[index]
  } else if ((index = INLINE_DIRECTIVES.indexOf(name)) > -1) {
    order = 'inline'
    genus = INLINE_DIRECTIVES[index]
  } else if ((index = MISC_DIRECTIVES.indexOf(name)) > -1) {
    order = 'misc'
    genus = MISC_DIRECTIVES[index]
  }

  return { order, genus }
}

/**
 * Ensure that attributes required for valid XHTML are present, and that
 * system defaults are merged into user settings
 * @param  {Object} obj  [description]
 * @param  {String} name [description]
 * @return {Object}
 */
const _extendWithDefaults = (obj, name) => {
  let taxonomy
  let result
  const { order, genus } = _getDirectiveTaxonomy(name)
  if (!order || !genus) { throw new TypeError(`Invalid directive type: [${name}]`) }

  switch (order) {
    case 'block':
      taxonomy = `${_lookUpFamily(genus)} ${genus}`
      result = Object.assign({}, obj)
      result.epubTypes = taxonomy
      if ({}.hasOwnProperty.call(obj, 'classes')) {
        result.classes = result.classes += ` ${taxonomy}`
      } else {
        result.classes = taxonomy
      }
      return result
    case 'inline':
      if (genus === 'image' || genus === 'inline-image') {
        result = Object.assign({}, obj)
        if (!{}.hasOwnProperty.call(obj, 'alt')) {
          result.alt = result.source
        }
      }
      return result
    case 'misc':
      return obj
    default:
      return obj
  }
}

/**
 * Create an object from attributes in the given directive
 * @param  {String} attrs   The directives attributes string
 * @param  {String} type    The type of directive
 * @param  {Object} context Markdown file where attributes method was called
 * @return {String}
 */
const attributesObject = (attrs, type, context) => {
  let attrsObject = {}
  if (!type || typeof type !== 'string') { throw new TypeError('No directive provided') }
  if (attrs && typeof attrs === 'string') {
    const body = attrs.trim()
    const attrsArray = _extractAttrs(body)
    try {
      attrsObject = _buildAttrObjects(attrsArray)
    } catch (err) {
      const { filename, lineNr } = context
      log.error(`
        Invalid directive: ${filename}:${lineNr}`)
      process.exit(1)
    }
  }

  const illegalAttrs = []
  for (const [k] of entries(attrsObject)) {
    if (supportedAttributes.indexOf(k) < 0) {
      illegalAttrs.push(k)
      delete attrsObject[k]
    }
  }
  if (illegalAttrs.length) { log.warn(`Removing illegal attributes: [${illegalAttrs.join()}]`) }
  const mergedAttrs = _extendWithDefaults(attrsObject, type)
  return mergedAttrs
}

/**
 * Create a string of attributes for an XHTML element
 * @param  {Object} obj An attributes object
 * @return {String}
 */
const attributesString = obj => _buildAttrString(obj)

/**
 * Convenience wrapper for creating attributes: String -> Object -> String
 * @param  {String} str     [description]
 * @param  {String} type    [description]
 * @param  {Object} context Markdown file where attributes method was called
 * @return {String}
 */
const attributes = (str, type, context) => _buildAttrString(attributesObject(str, type, context))

/**
 * [description]
 * @param  {String} s [description]
 * @return {String}
 */
const stringToCharCode = (s) => {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    out += `&#${s[i].charCodeAt(0)};`
  }
  return out
}

/**
 * [description]
 * @param  {String} s [description]
 * @return {String}
 */
const htmlId = s => `_${String(s).replace(/[^0-9a-zA-Z]/g, '_')}`


export { attributes, attributesObject, attributesString, stringToCharCode, htmlId }
