import fs from 'fs-extra'
import mime from 'mime-types'
import { terms, elements } from '@canopycanopycanopy/b-ber-shapes/dc'
import state from './State'

/**
 * Mehtods to detect XML media-type properties based on the content of XHTML documents
 * @namespace
 */
class ManifestItemProperties {
    /**
     * Detect if a file is an (X)HTML document
     * @param  {String}  file File path
     * @return {Boolean}
     */
    static isHTML(file) {
        return Boolean(
            mime.lookup(file.absolutePath) === 'text/html' ||
                mime.lookup(file.absolutePath) === 'application/xhtml+xml',
        )
    }

    /**
     * Detect if a file is an ePub navigation document
     * @param  {String}  file File path
     * @return {Boolean}
     */
    static isNav(file) {
        return Boolean(
            (mime.lookup(file.absolutePath) === 'text/html' ||
                mime.lookup(file.absolutePath) === 'application/xhtml+xml') &&
                /^toc\./.test(file.name),
        )
    }

    /**
     * Detect if an XHTML file contains JavaScript
     * @param  {String}  file File path
     * @return {Boolean}
     */
    static isScripted(file) {
        if (!ManifestItemProperties.isHTML(file)) return false

        // TODO: fixme; we need to check if the toc.xhtml is scripted, but it
        // hasn't been written to disk yet.  checking right now against the
        // results from `state.template.dynamicTail` for now, since we know
        // that the toc was written using that
        if (ManifestItemProperties.isNav(file)) {
            // the dynamicTail function in state throws an error initially,
            // though, as the function is assigned during the inject task, so
            // make sure to handle that
            let tail = ''
            try {
                tail = state.templates.dynamicPageTail()
            } catch (err) {
                if (/state.templates#dynamicPageTail/.test(err)) return false
                throw err
            }

            return tail.match(/<script/)
        }

        const contents = fs.readFileSync(file.absolutePath, 'utf8')
        return Boolean(contents.match(/<script/))
    }

    /**
     * Detect if an XHTML file contains SVG
     * @param  {String}  file File path
     * @return {Boolean}
     */
    static isSVG(file) {
        if (!ManifestItemProperties.isHTML(file)) return false
        const contents = fs.readFileSync(file.absolutePath, 'utf8')
        return Boolean(contents.match(/<svg/))
    }

    /**
     * Detect if a term is a Dublin Core `element`
     * @param  {Object}  data [description]
     * @return {Boolean}
     */
    static isDCElement(data) {
        return Boolean(
            {}.hasOwnProperty.call(data, 'term') &&
                elements.indexOf(data.term) > -1,
        )
    }

    /**
     * Detect if a term is a Dublin Core `term`
     * @param  {Object<String>}  data [description]
     * @return {Boolean}
     */
    static isDCTerm(data) {
        return Boolean(
            {}.hasOwnProperty.call(data, 'term') &&
                terms.indexOf(data.term) > -1,
        )
    }

    /**
     * Detect if an XHTML file contains remote resources
     * @param  {String}  file File path
     * @return {Boolean}
     */
    static hasRemoteResources(file) {
        if (!ManifestItemProperties.isHTML(file)) return false
        const fpath = file.absolutePath
        const contents = fs.readFileSync(fpath, 'utf8')
        return Boolean(contents.match(/src=(?:['"]{1})?https?/))
    }

    /**
     * Test if an XHTML file is a navigation document, contains JavaScript or
     * SVG
     * @param  {String} file  File path
     * @return {Array}        An array of dublin core media-type properties
     */
    static testHTML(file) {
        const props = []
        if (ManifestItemProperties.isNav(file)) props.push('nav')
        if (ManifestItemProperties.isScripted(file)) props.push('scripted')
        if (ManifestItemProperties.isSVG(file)) props.push('svg')
        if (ManifestItemProperties.hasRemoteResources(file)) { props.push('remote-resources') }
        return props
    }

    /**
     * Test if an object contains Dublin Core `term`s or `element`s
     * @param  {Object} data [description]
     * @return {Object<Boolean>}
     */
    static testMeta(data) {
        return {
            term: ManifestItemProperties.isDCTerm(data),
            element: ManifestItemProperties.isDCElement(data),
        }
    }
}

export default ManifestItemProperties
