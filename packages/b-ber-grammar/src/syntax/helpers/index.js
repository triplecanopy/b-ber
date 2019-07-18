/* eslint-disable no-plusplus, max-statements-per-line, no-continue, no-multi-assign, indent */
import path from 'path'
import has from 'lodash/has'
import { forOf } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import {
    BLOCK_DIRECTIVES,
    INLINE_DIRECTIVES,
    MISC_DIRECTIVES,
    FRONTMATTER_DIRECTIVES,
    BODYMATTER_DIRECTIVES,
    BACKMATTER_DIRECTIVES,
    ALL_DIRECTIVES,
    DIRECTIVES_REQUIRING_ALT_TAG,
    SUPPORTED_ATTRIBUTES,
    DRAFT_DIRECTIVES,
    DEPRECATED_DIRECTIVES,
} from '@canopycanopycanopy/b-ber-shapes/directives'

//
// querying hierarchies gets confusing, so we're using biological taxonomic
// rank as an analogue for classification. which is obvs less confusing...
//
// Class    -> Order  -> Family       -> Genus
// element  -> block  -> frontmatter  -> preface
//

const _lookUpFamily = genus =>
    FRONTMATTER_DIRECTIVES.indexOf(genus) > -1
        ? 'frontmatter'
        : BODYMATTER_DIRECTIVES.indexOf(genus) > -1
        ? 'bodymatter'
        : BACKMATTER_DIRECTIVES.indexOf(genus) > -1
        ? 'backmatter'
        : ''

// Determine the directive's classification and parent's type
const _directiveOrder = genus =>
    BLOCK_DIRECTIVES.indexOf(genus) > -1
        ? 'block'
        : INLINE_DIRECTIVES.indexOf(genus) > -1
        ? 'inline'
        : MISC_DIRECTIVES.indexOf(genus) > -1
        ? 'misc'
        : null

const _requiresAltTag = genus => DIRECTIVES_REQUIRING_ALT_TAG.indexOf(genus) > -1

const _isUnsupportedAttribute = (genus, attr) => {
    let key
    if (BLOCK_DIRECTIVES.indexOf(genus) > -1) {
        // these are all containers which share the same attributes, so they're
        // grouped under a single property
        key = 'block'
    } else {
        // this will be the directive name, e.g., figure, video, etc
        key = genus
    }

    return SUPPORTED_ATTRIBUTES[key][attr] !== true // bool
}

const _applyTransforms = (k, v) => {
    switch (k) {
        case 'classes':
            return ` class="${v}"`
        case 'epubTypes':
            return ` epub:type="${v}"`
        case 'pagebreak':
            return v === 'both'
                ? ' style="page-break-before:always; page-break-after:always;"'
                : ` style="page-break-${v}:always;"`
        case 'attrs':
            return ''
        case 'source':
            return ` src="${v}"`

        // media controls enabled by default
        case 'controls':
            return v === 'no' ? '' : ` ${k}="${k}"`

        // boolean attrs for audio/video elements
        case 'autoplay':
        case 'muted':
        case 'autobuffer':
        case 'loop':
            return v === 'yes' ? ` ${k}="${k}"` : ''

        default:
            return ` ${k}="${v}"`
    }
}

// MarkdownIt returns a trimmed string of the directive's attributes, which
// are parsed and transformed into a string of HTML attributes
//
//    ::: directive:id classes:"foo bar baz"
//    -> ' classes:"foo bar baz"
//    -> {classes:"foo bar baz"}
//    -> class="foo bar baz"
//
const parseAttrs = s => {
    const out = {}

    let str = ''
    let open
    let delim
    let char
    let next
    let key

    for (let i = 0; i < s.length; i++) {
        char = s[i].charCodeAt(0)
        next = s[i + 1] ? s[i + 1].charCodeAt(0) : ''

        if (!open && char === 58 /* : */) {
            // char is a token, we set `open` so that we don't misinterpret literals inside quotations
            open = true
            key = str
            str = ''
            delim = 32 /*   */
            if (next === 34 /* " */ || next === 39 /* ' */) {
                i++
                delim = next
            }
            continue
        }

        if (char === delim) {
            // token is ending delimiter since we've advanced our pointer
            key = key.trim() // trim whitespace, allowing for multiple spaces
            if (key) out[key] = str
            str = key = ''
            open = delim = null
            continue
        }

        str += s[i]

        if (i === s.length - 1) {
            // end of line
            if (key && key.length && str && str.length) {
                const key_ = key.trim()
                if (key_) out[key_] = str
            }
        }
    }

    return out
}

// -> prop="val"
const _buildAttrString = obj => {
    let s = ''
    Object.entries(obj).forEach(([key, val]) => (s += _applyTransforms(key, val)))
    return s
}

// Ensure that attributes required for valid XHTML are present, and that system
// defaults are merged into user settings
const _extendWithDefaults = (obj, genus) => {
    const result = { ...obj }
    const order = _directiveOrder(genus)
    if (!order) throw new TypeError(`Invalid directive type: [${genus}]`)

    let taxonomy
    switch (order) {
        case 'block':
        case 'misc':
            taxonomy = `${_lookUpFamily(genus)} ${genus}` // -> `bodymatter chapter`
            if (order === 'block') result.epubTypes = taxonomy
            if (has(obj, 'classes')) {
                taxonomy = `${_lookUpFamily(result.classes)} ${genus}`
                if (order === 'block') result.epubTypes = taxonomy
                result.classes += ` ${taxonomy}` // -> class="... bodymatter chapter"
            } else {
                result.classes = taxonomy // -> class="bodymatter chapter"
            }
            return result

        case 'inline':
            if (_requiresAltTag(genus) && !has(obj, 'alt')) {
                result.alt = result.source
            }

            return result

        default:
            return result
    }
}

// Create an object from attributes in the given directive
const attributesObject = (attrs, _genus, context = {}) => {
    const { fileName, lineNr } = context
    const attrsObject = {}

    let genus = _genus

    if (!genus || typeof genus !== 'string') {
        log.error(`No directive provided: ${fileName}:${lineNr}`)
    }

    if (ALL_DIRECTIVES.indexOf(genus) < 0) {
        log.error(`Invalid directive: [${genus}] at ${fileName}:${lineNr}`)
    }

    if (DRAFT_DIRECTIVES.indexOf(genus) > -1) {
        log.warn(`render [epub:${genus}] is [draft]. substituting with [chapter]`)
        genus = 'chapter'
    }

    if (DEPRECATED_DIRECTIVES.indexOf(genus) > -1) {
        log.warn(`render [epub:${genus}] is [deprecated]. substituting with [chapter]`)
        genus = 'chapter'
    }

    if (attrs && typeof attrs === 'string') {
        forOf(parseAttrs(attrs.trim()), (k, v) => {
            if (_isUnsupportedAttribute(_genus, k)) {
                return log.warn(`Omitting illegal attribute [${k}] at [${fileName}:${lineNr}]`)
            }

            attrsObject[k] = v
        })
    }

    // add original `_genus` as a class to the attrs object in case it's
    // different from the current `genus` (which might've changed due to it's
    // specification). do this to keep styling consistent
    if (genus !== _genus) {
        if (has(attrsObject, 'classes')) {
            attrsObject.classes += ` ${_genus}`
        } else {
            attrsObject.classes = _genus
        }
    }

    const mergedAttrs = _extendWithDefaults(attrsObject, genus)
    return mergedAttrs
}

// Create a string of attributes for an XHTML element
const attributesString = obj => _buildAttrString(obj)

// Convenience wrapper for creating attributes: String -> Object -> String
const attributes = (str, type, context) => _buildAttrString(attributesObject(str, type, context))

const htmlId = s => s.replace(/[^0-9a-zA-Z_-]/g, '-')

const toAlias = fpath => path.basename(path.basename(fpath, path.extname(fpath)))

export { attributes, attributesObject, attributesString, htmlId, parseAttrs, toAlias }
