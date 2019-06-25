// TODO: Git-hosted and npm-hosted HLJS conflict, so we're requiring HLJS from
// the src dir. Ideally we'd have our own fork where the dist version _and_ SCSS
// required by themes is available on npm
// @issue https://github.com/triplecanopy/b-ber/issues/288
import hljs from 'highlight.js/src/highlight'
import { extend, find } from 'lodash'
import MarkdownIt from 'markdown-it'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import state from '@canopycanopycanopy/b-ber-lib/State'
import markdownItFrontmatter from 'markdown-it-front-matter'
import markdownItFootnote from './parsers/footnote'
import markdownItSection from './syntax/section'
import markdownItPullquote from './syntax/pullquote'
import markdownItLogo from './syntax/logo'
import markdownItImage from './syntax/image'
import markdownItMedia from './syntax/media'
import markdownItDialogue from './syntax/dialogue'
import markdownItGallery from './syntax/gallery'
import markdownItSpread from './syntax/spread'

function deepFind(collection, fileName, callback) {
    const found = find(collection, { fileName })
    if (found) {
        if (callback) {
            callback(found)
            return
        }
        return found
    }

    collection.forEach(item => {
        // check against prop names
        if (item.nodes && item.nodes.length) {
            return deepFind(item.nodes, fileName)
        }
        return item
    })

    return collection
}

class MarkdownRenderer {
    constructor() {
        this.noop = MarkdownRenderer.noop

        // Instance of MarkdownIt class
        this.markdownIt = new MarkdownIt({
            html: true,
            xhtmlOut: true,
            breaks: false,
            linkify: false,

            // Syntax highlighting is done with highlight.js. It's up to
            // individual themes to include the highlight.js stylesheets, or to
            // add their own custom styles
            highlight: (str, lang) => {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(lang, str).value
                    } catch (_) {
                        /* noop */
                    }
                }

                return ''
            },
        })

        this.filename = ''

        const reference = { instance: this.markdownIt, context: this }

        this.markdownIt
            .use(markdownItSection.plugin, markdownItSection.name, markdownItSection.renderer(reference))
            .use(markdownItPullquote.plugin, markdownItPullquote.name, markdownItPullquote.renderer(reference))
            .use(markdownItFrontmatter, meta => {
                const filename = this.filename
                const YAMLMeta = YamlAdaptor.parse(meta)

                state.add('guide', { filename, ...YAMLMeta })

                const spineEntry = find(state.spine, { fileName: filename })

                // merge the found entry in the state and spine so that we
                // can access the metadata later. since deepFind is
                // expensive, don't try unless we know that the entry
                // exists
                if (spineEntry) {
                    deepFind(state.spine, filename, a => extend(a, YAMLMeta))
                    deepFind(state.toc, filename, a => extend(a, YAMLMeta))
                }
            })
            .use(markdownItFootnote, tokens => {
                const fileName = this.filename
                const entry = find(state.spine, { fileName })
                const title = entry && entry.title ? entry.title : fileName

                // add footnote container and heading. we're doing this here instead
                // of in `footnotes.js` because we need some file info (just the title :/)
                tokens.unshift(
                    {
                        type: 'block',
                        tag: 'section',
                        attrs: [['class', 'footnotes break-after']],
                        nesting: 1,
                        block: true,
                    },
                    {
                        type: 'block',
                        tag: 'h1',
                        nesting: 1,
                        block: true,
                    },
                    {
                        type: 'text',
                        block: false,
                        content: title,
                    },
                    {
                        type: 'block',
                        tag: 'h1',
                        nesting: -1,
                    },
                )

                // add closing section tag
                tokens.push({
                    type: 'block',
                    tag: 'section',
                    nesting: -1,
                })

                const notes = this.markdownIt.renderer.render(tokens, 0, {
                    reference: `${fileName}.xhtml`,
                })
                state.add('footnotes', { filename: fileName, title, notes })
            })
            .use(markdownItDialogue.plugin, markdownItDialogue.name, markdownItDialogue.renderer(reference))
            .use(markdownItGallery.plugin, markdownItGallery.name, markdownItGallery.renderer(reference))
            .use(markdownItSpread.plugin, markdownItSpread.name, markdownItSpread.renderer(reference))
            .use(markdownItImage.plugin, markdownItImage.name, markdownItImage.renderer(reference))
            .use(markdownItMedia.plugin, markdownItMedia.name, markdownItMedia.renderer(reference))
            .use(markdownItLogo.plugin, markdownItLogo.name, markdownItLogo.renderer(reference))
    }

    set filename(name) {
        this._filename = name
    }

    get filename() {
        return this._filename
    }

    template(meta) {
        const str = meta
            .split('\n')
            .map(a => `  ${a}`)
            .join('\n')
        return `-\n  filename: ${this.filename}\n${str}\n`
    }

    // Transforms a markdown file to XHTML
    render(filename, data) {
        this.filename = filename
        return this.markdownIt.render(data)
    }
}

const markdownRenderer = new MarkdownRenderer()
export default markdownRenderer
