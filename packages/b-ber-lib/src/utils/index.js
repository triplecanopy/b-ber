/**
 * @module utils
 */

import path from 'path'
import find from 'lodash/find'
import log from '@canopycanopycanopy/b-ber-logger'

/**
 * Get a file's relative path to the OPS
 * @param  {String} fpath File path
 * @param  {String} base  Project's base path
 * @return {String}
 */
const opsPath = (fpath, base) =>
    fpath.replace(new RegExp(`^${base}${path.sep}OPS${path.sep}?`), '')

/**
 * [description]
 * @param  {String} str [description]
 * @return {String}
 */

// https://www.w3.org/TR/xml-names/#Conformance
const fileId = str => `_${str.replace(/[^a-zA-Z0-9_]/g, '_')}`

/**
 * Determine an image's orientation
 * @param  {Number} w Image width
 * @param  {Number} h Image Height
 * @return {String}
 */
const getImageOrientation = (w, h) => {
    // assign image class based on w:h ratio
    const widthToHeight = w / h
    let imageType = null

    if (widthToHeight < 0.61) imageType = 'portrait-high'
    if (widthToHeight >= 0.61 && widthToHeight < 1) imageType = 'portrait'
    if (widthToHeight === 1) imageType = 'square'
    if (widthToHeight > 1) imageType = 'landscape'
    return imageType
}

/**
 * Create an iterator from object's key/value pairs
 * @param {Object} collection   [description]
 * @param {Object} iterator     [description]
 * @return {*}
 */
const forOf = (collection, iterator) =>
    Object.entries(collection).forEach(([key, val]) => iterator(key, val))

// TODO: the whole figures/generated pages/user-configurable YAML thing should
// be worked out better. one reason is below, where we need the title of a
// generated page, but since metadata is attache in the frontmatter YAML of an
// MD file, there is no reference for the metadata.
//
// this is provisional, will just cause more confusion in the future
const getTitleOrName = page => {
    if (page.name === 'figures-titlepage') {
        return 'Figures'
    }

    return page.title || page.name
}

const getBookMetadata = (term, state) => {
    const entry = find(state.metadata, { term })
    if (entry && entry.value) return entry.value
    log.warn(`Could not find metadata value for ${term}`)
    return ''
}

export {
    opsPath,
    fileId,
    getImageOrientation,
    forOf,
    getTitleOrName,
    getBookMetadata,
}
