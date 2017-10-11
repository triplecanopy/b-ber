/**
 * Returns an instance of the MarkdownRenderer class
 * @module md
 * @see {@link module:md#MarkdownRenderer}
 * @return {MarkdownRenderer}
 */

import Yaml from 'bber-lib/yaml'
import MarkdownIt from 'markdown-it'
import mdFrontMatter from 'markdown-it-front-matter'
import store from 'bber-lib/store'
import mdFootnote from 'bber-plugins/md/plugins/footnote'
import mdSection from 'bber-plugins/md/directives/section'
import mdPullQuote from 'bber-plugins/md/directives/pullquote'
import mdLogo from 'bber-plugins/md/directives/logo'
import mdImage from 'bber-plugins/md/directives/image'
import mdMedia from 'bber-plugins/md/directives/media'
import mdDialogue from 'bber-plugins/md/directives/dialogue'
// import mdEpigraph from 'bber-plugins/md/directives/epigraph'

import util from 'util'
import { extend, find } from 'lodash'


function deepFind(collection, fileName, callback) {
    const found = find(collection, { fileName })
    if (found) {
        if (callback) {
            callback(found)
            return
        }
        return found
    }

    collection.forEach((item) => { // check against prop names
        if (item.nodes && item.nodes.length) {
            return deepFind(item.nodes, fileName)
        }
        return item
    })

    return collection
}

/**
 * Transform markdown into XHTML
 * @alias module:md#MarkdownRenderer
 */
class MarkdownRenderer {

    /**
     * @constructor
     */
    constructor() {
        this.noop = MarkdownRenderer.noop

        /**
         * Instance of MarkdownIt class
         * @member
         * @memberOf module:md#MarkdownRenderer
         * @see {@link https://github.com/markdown-it/markdown-it|markdown-it}
         * @type {MarkdownIt}
         */
        this.md = new MarkdownIt({
            html: true,
            xhtmlOut: true,
            breaks: false,
            linkify: false,
        })

        /**
         * [filename description]
         * @member
         * @memberOf module:md#MarkdownRenderer
         * @type {String}
         */
        this.filename = ''

        const context = this
        const instance = this.md
        const reference = { instance, context }

        instance
            .use(
                mdSection.plugin,
                mdSection.name,
                mdSection.renderer(reference))
            .use(
                mdPullQuote.plugin,
                mdPullQuote.name,
                mdPullQuote.renderer(reference))
            .use(
                mdFrontMatter,
                (meta) => {

                    const filename = this.filename
                    const YAMLMeta = Yaml.parse(meta)

                    store.add('guide', { filename, ...YAMLMeta })

                    const spineEntry = find(store.spine, { fileName: filename })

                    // merge the found entry in the store and spine so that we
                    // can access the metadata later. since deepFind is
                    // expensive, don't try unless we know that the entry
                    // exists
                    if (spineEntry) {

                        deepFind(store.spine, filename, found => extend(found, YAMLMeta))
                        deepFind(store.toc, filename, found => extend(found, YAMLMeta))

                    }

                })
            .use(
                mdFootnote,
                (tokens) => {
                    const fileName = this.filename

                    // TODO: add footnotes to spine if not already added
                    const entry = find(store.spine, { fileName })
                    const title = entry && entry.title ? entry.title : fileName

                    // add footnote container and heading. we're doing this here instead
                    // of in `footnotes.js` because we need some file info (just the title :/)
                    tokens.unshift({
                        type: 'block',
                        tag: 'section',
                        attrs: [['class', 'footnotes break-after']],
                        nesting: 1,
                        block: true,
                    }, {
                        type: 'block',
                        tag: 'h1',
                        nesting: 1,
                        block: true,
                    }, {
                        type: 'text',
                        block: false,
                        content: title,
                    }, {
                        type: 'block',
                        tag: 'h1',
                        nesting: -1,
                    })

                    // add closing section tag
                    tokens.push({
                        type: 'block',
                        tag: 'section',
                        nesting: -1,
                    })

                    const notes = instance.renderer.render(tokens, 0, { reference: `${fileName}.xhtml` })
                    store.add('footnotes', { filename: fileName, title, notes })
                })
            .use(
                mdDialogue.plugin,
                mdDialogue.name,
                mdDialogue.renderer(reference))
            .use(
                mdImage.plugin,
                mdImage.name,
                mdImage.renderer(reference))
            .use(
                mdMedia.plugin,
                mdMedia.name,
                mdMedia.renderer(reference))
            // .use(
            //   mdEpigraph.plugin,
            //   mdEpigraph.name,
            //   mdEpigraph.renderer(reference))
            .use(
                mdLogo.plugin,
                mdLogo.name,
                mdLogo.renderer(reference))
    }

    set filename(name) {
        this._filename = name
    }

    get filename() {
        return this._filename
    }

    /**
     * [template description]
     * @param  {Array} meta [description]
     * @return {String}
     */
    template(meta) {
        const str = meta.split('\n').map(_ => `  ${_}`).join('\n')
        return `-\n  filename: ${this.filename}\n${str}\n`
    }

    /**
     * Transforms a markdown file to XHTML
     * @param  {String} filename [description]
     * @param  {Object} data     [description]
     * @return {String}
     */
    render(filename, data) {
        this.filename = filename
        return this.md.render(data)
    }

}

export default process.env.NODE_ENV === 'test' ? MarkdownRenderer : new MarkdownRenderer()
