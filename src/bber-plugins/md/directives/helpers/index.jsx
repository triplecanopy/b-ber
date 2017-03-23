
import { entries } from 'bber-utils'

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
  arr.map((_) => {
    const [k, v] = _.split(':')
    o[k.trim()] = v.trim().replace(/(?:^["']|["']$)/g, '')
    return o
  })
  return o
}

const _applyTransforms = (k, v) => {
  switch (k) {
    case 'classes':
      return ` class="${v}"`
    case 'epubTypes':
      return ` epub:type="${v}"`
    case 'pagebreak':
      return ` style="page-break-${v}:always;"`
    case 'autoplay':
    case 'loop':
    case 'controls':
    case 'muted':
      return ` ${k}="${k}"`
    case 'attrs':
      return ''
    default:
      return ` ${k}="${v}"`
  }
}

// -> foo="bar" baz="qux"
const _buildAttrString = (obj) => {
  let s = ''
  for (const [k, v] of entries(obj)) {
    s += _applyTransforms(k, v)
  }
  return s
}

const _lookupParentType = (sectionType) => {
  switch (sectionType) {
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

const _extendWithDefaults = (obj, sectionType) => {
  const types = `${_lookupParentType(sectionType)} ${sectionType}`
  const result = Object.assign({}, obj)
  result.epubTypes = types
  if ({}.hasOwnProperty.call(obj, 'classes')) {
    result.classes = result.classes += ` ${types}`
  } else {
    result.classes = types
  }
  return result
}

/**
 * [description]
 * @param  {String} str  [description]
 * @param  {String} type [description]
 * @return {String}
 */
const attributes = (str, type) => {
  if (!str && typeof str !== 'string') { return '' }
  const body = str.trim()
  const attrsArray = _extractAttrs(body)
  const attrsObject = _buildAttrObjects(attrsArray)
  const mergedAttrs = _extendWithDefaults(attrsObject, type)
  const attrs = _buildAttrString(mergedAttrs)
  return attrs
}

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
 * @param  {String} a   [description]
 * @param  {Array} arr  [description]
 * @return {Boolean}
 */
const isValidAttr = (a, arr) => arr.indexOf(a) > -1

/**
 * [description]
 * @param  {String} s [description]
 * @return {String}
 */
const htmlId = s => `_${String(s).replace(/[^0-9a-z]/, '_')}`

export { attributes, stringToCharCode, isValidAttr, htmlId }
