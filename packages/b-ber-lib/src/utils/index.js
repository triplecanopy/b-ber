import fs from 'fs-extra'
import path from 'path'
import find from 'lodash/find'
import uniq from 'lodash/uniq'
import log from '@canopycanopycanopy/b-ber-logger'
import sequences from '@canopycanopycanopy/b-ber-shapes/sequences'
import findIndex from 'lodash/findIndex'
import ffprobe from 'ffprobe'
import ffprobeStatic from 'ffprobe-static'
import mime from 'mime-types'
import { Url } from '..'

// Get a file's relative path to the OPS
export const opsPath = (fpath, base) => fpath.replace(new RegExp(`^${base}${path.sep}OPS${path.sep}?`), '')

// https://www.w3.org/TR/xml-names/#Conformance
export const fileId = str => `_${str.replace(/[^a-zA-Z0-9_-]/g, '_')}`

// Determine an image's orientation
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

const getAspectRatioClassName = (key = '16:9') =>
    ({ '4:3': 'video--4x3', '16:9': 'video--16x9', '21:9': 'video--21x9' }[key])

export const getVideoAspectRatio = async filePath => {
    if (!filePath) return getAspectRatioClassName()

    const { streams } = await ffprobe(filePath, { path: ffprobeStatic.path })
    if (!streams) return getAspectRatioClassName()
    const { display_aspect_ratio: aspectRatio } = streams
    return getAspectRatioClassName(aspectRatio)
}

// Create an iterator from object's key/value pairs
export const forOf = (collection, iterator) => Object.entries(collection).forEach(([key, val]) => iterator(key, val))

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
    const entry = find(state.metadata.json(), { term })
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
        ].concat(dirs),
    ).map(a => fs.ensureDir(path.join(cwd, a)))

    return Promise.all(dirs_)
}

const ensureFiles = (files, prefix) => {
    const cwd = process.cwd()
    const files_ = Object.keys(sequences)
        .map(a => ({
            absolutePath: path.join(cwd, prefix, '_project', `${a}.yml`),
            content: '',
        }))
        .filter(({ absolutePath }) => findIndex(files, { absolutePath }) < 0)
        .concat(files)
        .reduce(
            (acc, curr) =>
                fs.existsSync(curr.absolutePath) ? acc : acc.concat(fs.writeFile(curr.absolutePath, curr.content)),
            [],
        )
    return Promise.all(files_)
}

// make sure all necessary files and directories exist
export const ensure = ({ files = [], dirs = [], prefix = '' } = {}) =>
    new Promise(resolve =>
        ensureDirs(dirs, prefix)
            .then(() => ensureFiles(files, prefix))
            .then(resolve)
            .catch(log.error),
    )

export const addTrailingSlash = _s => {
    let s = _s
    if (s === '/') return s
    if (s.charCodeAt(s.length - 1) !== 47 /* / */) s += '/'
    return s
}

export const generateWebpubManifest = (state, files) => {
    const remoteURL = Url.trimSlashes(state.config.remote_url)
    const readingOrder = state.spine.flattened.map(({ name, title }) => ({
        href: `${remoteURL}/text/${name}.xhtml`,
        type: 'text/xhtml',
        title,
    }))

    const resources = files
        .filter(file => path.basename(file).charAt(0) !== '.')
        .map(file => ({
            // rel: ...
            href: file.replace(`${state.distDir}/`, ''),
            type: mime.lookup(file),
        }))

    const manifest = {
        '@context': 'https://readium.org/webpub-manifest/context.jsonld',

        metadata: {
            '@type': 'http://schema.org/Book',
            title: getBookMetadata('title', state),
            author: getBookMetadata('creator', state),
            identifier: getBookMetadata('identifier', state),
            language: getBookMetadata('language', state),
            publisher: getBookMetadata('publisher', state),
            modified: new Date().toISOString(),
        },

        links: [
            { rel: 'self', href: `${remoteURL}/manifest.json`, type: 'application/webpub+json' },
            // { rel: 'alternate', href: `${remoteURL}/publication.epub`, type: 'application/epub+zip' },
            // { rel: 'search', href: `${remoteURL}/search{?query}`, type: 'text/html', templated: true },
        ],

        readingOrder,
        resources,
    }

    return manifest
}
