import { utils } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import epub from './epub'
import mobi from './mobi'
import reader from './reader'
import type { FigureData, FigureTemplates } from './types'
import web from './web'

const { getImageOrientation } = utils

const figures: Record<string, FigureTemplates> = { epub, mobi, reader, web }

type Mime = FigureData['mime']

// `test` converts its argument with ToString, which is what `String` does, so
// `false`, null and undefined become strings that do not match, as before
const isImage = (mime: Mime) => /^image/.test(String(mime))
const isAudio = (mime: Mime) => /^audio/.test(String(mime))
const isVideo = (mime: Mime) => /^video/.test(String(mime))
const isIframe = (type: string | undefined) => type === 'iframe'
const isVimeo = (type: string | undefined) => type === 'vimeo'

const figure = (data: FigureData, buildType?: string): string => {
  const { width, height, mime, type } = data
  const build = !buildType || !figures[buildType] ? 'epub' : buildType

  let format: string | null = null

  if (isIframe(type) || isVimeo(type)) {
    format = type
  } else if (isImage(mime)) {
    // Only b-ber-grammar-image sets an image MIME type, and it always sets the
    // pixel dimensions
    format = getImageOrientation(width as number, height as number)
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

  // `format` is derived from the data's own MIME type or directive, so the
  // template it selects is the one that accepts this data
  return (
    figures[build][format as keyof FigureTemplates] as (
      data: FigureData
    ) => string
  )(data)
}

export default figure
