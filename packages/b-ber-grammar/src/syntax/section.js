import state from '@canopycanopycanopy/b-ber-lib/State'
import {htmlComment} from '@canopycanopycanopy/b-ber-lib/utils'
import {BLOCK_DIRECTIVES} from '@canopycanopycanopy/b-ber-shapes/directives'
import find from 'lodash/find'
import plugin from '../parsers/section'
import renderFactory from './factory/block'
import {attributes, htmlId} from './helpers'

// this matches *all* container-type directives, and outputs the appropriate
// HTML based on user-defined attributes
const containers = BLOCK_DIRECTIVES.join('|')
const markerOpen = new RegExp(`^(${containers}|exit)(?::([^\\s]+)(\\s.*)?)?$`) // treat `exit` like an opening marker since we're using it as such
const markerClose = /(exit)(?::([^\s]+))?/

// since `context` needs to be available in this `render` method, we curry it
// in and pass the resulting function to the `renderFactory` below. we also
// set a default for `context` since we'll need some of its properties during
// testing
const render = ({context = {}}) => (tokens, idx) => {
    const lineNr = tokens[idx].map ? tokens[idx].map[0] : null
    const filename = `_markdown/${context.filename}.md`

    let result = ''

    if (tokens[idx].nesting === 1) { // token open, we ignore closing tokens and let `exit` handle those
        const close = tokens[idx].info.trim().match(markerClose)
        const open = tokens[idx].info.trim().match(markerOpen)


        if (close) {
            const [, type, id] = close
            const comment = htmlComment(`END: section:${type}#${htmlId(id)}`)
            const directive = find(state.cursor, {id})

            // TODO: the parser needs to be more discerning. should include
            // checking the attr types and the calls to open/close in a more
            // transparent way. refactoring candidate.

            if (directive && directive.type === 'gallery' && (state.build === 'web' || state.build === 'reader')) {
                state.remove('cursor', {id})
                result = `
                            </div>
                        </figure>
                    </div>${comment}`
            } else {
                state.remove('cursor', {id})
                result = `</section>${comment}`
            }
        } else {
            // destructure the attributes from matches, omitting `matches[0]` since
            // we're only interested in the captures
            const [, type, id, att] = open
            const comment = htmlComment(`START: section:${type}#${htmlId(id)}; ${filename}:${lineNr}`)
            const attrs = attributes(att, type, {filename, lineNr})
            result = `${comment}<section id="${htmlId(id)}"${attrs}>`
        }
    }
    return result
}

export default {
    plugin,
    name: 'section',
    renderer: args =>
        renderFactory({
            ...args,
            markerOpen,
            markerClose,
            render: render(args),
        }),
}
