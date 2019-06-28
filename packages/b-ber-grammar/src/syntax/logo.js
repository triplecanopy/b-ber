import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import figure from '../parsers/figure'
import { attributesString, attributesObject, htmlId } from './helpers'

const markerRe = /^logo/
const directiveRe = /(logo)(?::([^\s]+)(\s?.*)?)?$/

export default {
    plugin: figure,
    name: 'logo',
    renderer: ({ context }) => ({
        marker: ':',
        minMarkers: 3,
        validate(params) {
            return params.trim().match(markerRe)
        },
        render(tokens, idx) {
            const match = tokens[idx].info.trim().match(directiveRe)
            if (!match) return ''

            const fileName = `_markdown/${context.fileName}.md`
            const lineNr = tokens[idx].map ? tokens[idx].map[0] : null
            const [, type, id, attrs] = match

            const attrsObj = attributesObject(attrs, type, { fileName, lineNr })

            if (!attrsObj.source) {
                log.error('[source] attribute is required by [logo] directive, aborting')
            }

            const inputImagePath = state.src.images(attrsObj.source)
            const outputImagePath = `../images/${attrsObj.source}`

            if (!fs.existsSync(inputImagePath)) log.warn(`Image [${attrsObj.source}] does not exist`)

            delete attrsObj.source // since we need the path relative to `images`
            const attrString = attributesString(attrsObj, type)

            return `
                <figure id="${htmlId(id)}" class="logo">
                    <img style="width:120px;" src="${outputImagePath}" ${attrString}/>
                </figure>`
        },
    }),
}
