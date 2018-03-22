/**
 * Returns an instance of the MarkdownRenderer class
 * @module md
 * @see {@link module:md#MarkdownRenderer}
 * @return {MarkdownRenderer}
 */

import hlsj from 'highlight.js'
import {extend, find} from 'lodash'
import MarkdownIt from 'markdown-it'
import mdFrontMatter from 'markdown-it-front-matter'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import state from '@canopycanopycanopy/b-ber-lib/State'
import mdFootnote from './parsers/footnote'
import mdSection from './syntax/section'
import mdPullQuote from './syntax/pullquote'
import mdLogo from './syntax/logo'
import mdImage from './syntax/image'
import mdMedia from './syntax/media'
import mdDialogue from './syntax/dialogue'
import mdGallery from './syntax/gallery'
// import {env} from '@canopycanopycanopy/b-ber-lib/utils'
// import mdEpigraph from './syntax/epigraph'



function deepFind(collection, fileName, callback) {
    const found = find(collection, {fileName})
    if (found) {
        if (callback) {
            callback(found)
            return
        }
        return found
    }

    collection.forEach(item => { // check against prop names
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
         * @see {@link https://github.com/markdown-it/markdown-it}
         * @type {MarkdownIt}
         */
        this.md = new MarkdownIt({
            html: true,
            xhtmlOut: true,
            breaks: false,
            linkify: false,

            // Syntax highlighting is done with highlight.js. It's up to
            // individual themes to include the highlight.js stylesheets, or to
            // add their own custom styles
            highlight: (str, lang) => {
                if (lang && hlsj.getLanguage(lang)) {
                    try {
                        return hlsj.highlight(lang, str).value
                    } catch (_) {/* noop */}
                }

                return ''
            },
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
        const reference = {instance, context}

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
                meta => {

                    const filename = this.filename
                    const YAMLMeta = YamlAdaptor.parse(meta)

                    state.add('guide', {filename, ...YAMLMeta})

                    const spineEntry = find(state.spine, {fileName: filename})

                    // merge the found entry in the state and spine so that we
                    // can access the metadata later. since deepFind is
                    // expensive, don't try unless we know that the entry
                    // exists
                    if (spineEntry) {

                        deepFind(state.spine, filename, found => extend(found, YAMLMeta))
                        deepFind(state.toc, filename, found => extend(found, YAMLMeta))

                    }

                })
            .use(
                mdFootnote,
                tokens => {
                    const fileName = this.filename

                    // TODO: add footnotes to spine if not already added
                    const entry = find(state.spine, {fileName})
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

                    const notes = instance.renderer.render(tokens, 0, {reference: `${fileName}.xhtml`})
                    state.add('footnotes', {filename: fileName, title, notes})
                })
            .use(
                mdDialogue.plugin,
                mdDialogue.name,
                mdDialogue.renderer(reference))
            .use(
                mdGallery.plugin,
                mdGallery.name,
                mdGallery.renderer(reference))
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

const markdownRenderer = new MarkdownRenderer()
export default markdownRenderer
