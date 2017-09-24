/**
 * @module utils
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import { isPlainObject } from 'lodash'
import store from 'bber-lib/store'

const cwd = process.cwd()

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
 * [description]
 * @param  {Array} a [description]
 * @return {String}
 */
const hrtimeformat = (a) => {
    const s = (a[0] * 1000) + (a[1] / 1000000)
    return `${String(s).slice(0, -3)}ms`
}

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

    if (widthToHeight < 0.61)                       { imageType = 'portrait-high' }
    if (widthToHeight >= 0.61 && widthToHeight < 1) { imageType = 'portrait' }
    if (widthToHeight === 1)                        { imageType = 'square' }
    if (widthToHeight > 1)                          { imageType = 'landscape' }
    return imageType
}

/**
 * Create an iterator from object's key/value pairs
 * @param {Object} collection   [description]
 * @param {Object} iterator     [description]
 * @return {*}
 */
const forOf = (collection, iterator) =>
    Object.entries(collection).forEach(([key, val]) =>
        iterator(key, val)
    )


/**
 * [description]
 * @return {String}
 */
const src = () => {
    if (!store.builds[store.build] || !store.builds[store.build].src) {
        store.update('build', 'epub')
    }
    return path.join(cwd, store.builds[store.build].src)
}

/**
 * [description]
 * @return {String}
 */

const dist = () => {
    if (!store.builds[store.build] || !store.builds[store.build].dist) {
        store.update('build', 'epub')
    }
    return path.join(cwd, store.builds[store.build].dist)
}

const build = () => store.build

const env = () => store.env

const version = () => store.version

const theme = () =>  store.theme

const metadata = () => store.metadata

/**
 * [description]
 * @param  {Array<Object<Promise>>} promiseArray [description]
 * @return {Object<Promise|Error>}
 */
const promiseAll = promiseArray =>
    new Promise(resolve =>
        Promise.all(promiseArray).then(resolve)
    )

const htmlComment = str => `\n<!-- ${str} -->\n`

const passThrough = args => args

const escapeHTML = (str) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }
    return str.replace(/[&<>"']/g, m => map[m])
}

// for generating page models used in navigation
const spineModel = () => ({
    relativePath: '',
    absolutePath: '',
    extension: '',
    fileName: '',
    name: '',
    // baseName: '',
    remotePath: '',
    type: '',
    title: '',
    // pageOrder: -1,
    linear: true,
    in_toc: true,
    nodes: [],
})

/**
 * [description]
 * @param {String} _str    File basename with extension
 * @param {String} _src   Current `src` directory name
 * @return {Object}
 */
const modelFromString = (_str, _src) => {
    const str = String(_str)
    const pathFragment = /^(toc\.x?html|nav\.ncx)$/i.test(str) ? '' : 'text' // TODO: clean this up
    const relativePath = path.join(pathFragment, str) // relative to OPS
    const absolutePath = path.join(cwd, _src, relativePath)
    const extension = path.extname(absolutePath)
    const fileName = path.basename(absolutePath)
    const name = path.basename(absolutePath, extension)

    // const baseName = path.basename(absolutePath, extension)
    const remotePath = '' // TODO: add remote URL where applicable
    return {
        ...spineModel(),
        relativePath,
        absolutePath,
        extension,
        fileName,
        name,
        remotePath,
    }
}

const modelFromObject = (_obj, _src) => {
    const { in_toc, linear } = _obj[Object.keys(_obj)[0]]
    const str = Object.keys(_obj)[0]
    const model = modelFromString(str, _src)

    return { ...model, in_toc, linear }
}

const nestedContentToYAML = (arr, result = []) => {
    arr.forEach((_) => {
        const model = {}

        // TODO: check for custom attrs somewhere else.
        if (_.linear === false || _.in_toc === false) {
            if (_.in_toc === false) { model.in_toc = false }
            if (_.linear === false) { model.linear = false }
            result.push({ [_.fileName]: model })
        } else {
            result.push(_.fileName)
            if (_.nodes && _.nodes.length) {
                model.section = []
                result.push(model)
                nestedContentToYAML(_.nodes, model.section)
            }
        }
    })

    return result
}


const flattenSpineFromYAML = arr =>
    arr.reduce((acc, curr) => {
        if (isPlainObject(curr)) {
            if (Object.keys(curr)[0] === 'section') {
                return acc.concat(flattenSpineFromYAML(curr.section))
            }
            return acc.concat(Object.keys(curr)[0])
        }
        return acc.concat(curr)
    }, [])

export {
    opsPath,
    fileId,
    hrtimeformat,
    getImageOrientation,
    forOf,
    src,
    dist,
    build,
    env,
    theme,
    version,
    metadata,
    promiseAll,
    htmlComment,
    passThrough,
    escapeHTML,
    spineModel,
    modelFromObject,
    modelFromString,
    nestedContentToYAML,
    flattenSpineFromYAML,
}
