/**
 * @module utils
 */

import fs from 'fs-extra'
import path from 'path'
import find from 'lodash/find'
import uniq from 'lodash/uniq'
import log from '@canopycanopycanopy/b-ber-logger'

/**
 * Get a file's relative path to the OPS
 * @param  {String} fpath File path
 * @param  {String} base  Project's base path
 * @return {String}
 */
export const opsPath = (fpath, base) =>
    fpath.replace(new RegExp(`^${base}${path.sep}OPS${path.sep}?`), '')

/**
 * [description]
 * @param  {String} str [description]
 * @return {String}
 */

// https://www.w3.org/TR/xml-names/#Conformance
export const fileId = str => `_${str.replace(/[^a-zA-Z0-9_-]/g, '_')}`

/**
 * Determine an image's orientation
 * @param  {Number} w Image width
 * @param  {Number} h Image Height
 * @return {String}
 */
export const getImageOrientation = (w, h) => {
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
export const forOf = (collection, iterator) =>
    Object.entries(collection).forEach(([key, val]) => iterator(key, val))

// TODO: the whole figures/generated pages/user-configurable YAML thing should
// be worked out better. one reason is below, where we need the title of a
// generated page, but since metadata is attached in the frontmatter YAML of an
// MD file, there is no reference for the metadata.
// @issue: https://github.com/triplecanopy/b-ber/issues/208
//
// this is provisional, will just cause more confusion in the future
export const getTitleOrName = page => {
    if (page.name === 'figures-titlepage') {
        return 'Figures'
    }

    return page.title || page.name
}

export const getBookMetadata = (term, state) => {
    const entry = find(state.metadata, { term })
    if (entry && entry.value) return entry.value
    log.warn(`Could not find metadata value for ${term}`)
    return ''
}

export const safeCopy = (from, to) => {
    try {
        if (fs.existsSync(to)) {
            throw new Error('EEXIST')
        }
    } catch (err) {
        if (err.message === 'EEXIST') return Promise.resolve()
    }

    return fs.copy(from, to)
}

export const safeWrite = (dest, data) => {
    try {
        if (fs.existsSync(dest)) {
            throw new Error('EEXIST')
        }
    } catch (err) {
        if (err.message === 'EEXIST') return Promise.resolve()
    }

    return fs.writeFile(dest, data)
}

export const fail = (msg, err, yargs) => {
    yargs.showHelp()
    process.exit(0)
}

const ensureDirs = (dirs, prefix) => {
    const cwd = process.cwd()
    const dirs_ = uniq(
        [
            `${prefix}/_project`,
            `${prefix}/_project/_fonts`,
            `${prefix}/_project/_images`,
            `${prefix}/_project/_javascripts`,
            `${prefix}/_project/_markdown`,
            `${prefix}/_project/_media`,
            `${prefix}/_project/_stylesheets`,
            `${prefix}/themes`,
        ].concat([...dirs]),
    ).map(a => fs.ensureDir(path.join(cwd, a)))
    return Promise.all(dirs_)
}

const ensureFiles = (files, prefix) => {
    const cwd = process.cwd()
    const files_ = ['epub', 'mobi', 'web', 'sample', 'reader']
        .map(a => ({
            absolutePath: path.join(cwd, prefix, '_project', `${a}.yml`),
            content: '',
        }))
        .concat([...files])
        .reduce(
            (acc, curr) =>
                fs.existsSync(curr.absolutePath)
                    ? acc
                    : acc.concat(fs.writeFile(curr.absolutePath, curr.content)),
            [],
        )
    return Promise.all(files_)
}

// make sure all necessary files and directories exist
export const ensure = (assets = { files: [], dirs: [], prefix: '' }) =>
    new Promise(resolve =>
        ensureDirs(assets.dirs, assets.prefix)
            .then(() => ensureFiles(assets.files, assets.prefix))
            .then(resolve)
            .catch(log.error),
    )
