import { getImageOrientation } from 'bber-utils'
import { log } from 'bber-plugins'
import epub from './epub'
import mobi from './mobi'

const figures = { epub, mobi }

const isImage = mime => /^image/.test(mime)
const isAudio = mime => /^audio/.test(mime)
const isVideo = mime => /^video/.test(mime)

const figure = (data, env) => {
    const { width, height, mime } = data
    const type = !env || !{}.hasOwnProperty.call(figures, env) ? 'epub' : env
    const format = isImage(mime) ? getImageOrientation(width, height) : isAudio(mime) ? 'audio' : isVideo(mime) ? 'video' : null

    if (!format) {
        log.error(`bber-templates: [${data.source}] is of unsupported media type [${mime}]`, 1)
    }

    return figures[type][format](data)
}

export default figure
