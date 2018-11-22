import { getImageOrientation } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import epub from './epub'
import mobi from './mobi'
import reader from './reader'

const figures = { epub, mobi, reader }

const isImage = mime => /^image/.test(mime)
const isAudio = mime => /^audio/.test(mime)
const isVideo = mime => /^video/.test(mime)
const isIframe = type => type === 'iframe'

const figure = (data, env) => {
    const { width, height, mime, type } = data
    const _env = !env || !{}.hasOwnProperty.call(figures, env) ? 'epub' : env

    let format = null
    if (isIframe(type)) {
        format = 'iframe'
    } else if (isImage(mime)) {
        format = getImageOrientation(width, height)
    } else if (isAudio(mime)) {
        format = 'audio'
    } else if (isVideo(mime)) {
        format = 'video'
    }

    if (!format) {
        log.error(
            `bber-templates: [${
                data.source
            }] is of unsupported media type [${mime}]`,
        )
    }

    return figures[_env][format](data)
}

export default figure
