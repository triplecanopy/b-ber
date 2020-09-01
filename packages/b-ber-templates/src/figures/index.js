import { getImageOrientation } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import epub from './epub'
import mobi from './mobi'
import reader from './reader'
import web from './web'

const figures = { epub, mobi, reader, web }

const isImage = mime => /^image/.test(mime)
const isAudio = mime => /^audio/.test(mime)
const isVideo = mime => /^video/.test(mime)
const isIframe = type => type === 'iframe'
const isVimeo = type => type === 'vimeo'

const figure = (data, buildType) => {
  const { width, height, mime, type } = data
  const build = !buildType || !figures[buildType] ? 'epub' : buildType

  let format = null

  if (isIframe(type) || isVimeo(type)) {
    format = type
  } else if (isImage(mime)) {
    format = getImageOrientation(width, height)
  } else if (isAudio(mime)) {
    format = 'audio'
  } else if (isVideo(mime)) {
    format = 'video'
  }

  if (!format) {
    log.error(
      `bber-templates: [${data.source}] is of unsupported media type [${mime}]`
    )
  }

  return figures[build][format](data)
}

export default figure
