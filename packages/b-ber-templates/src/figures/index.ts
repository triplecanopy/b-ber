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

// `test` converts `false`, null and undefined to strings, none of which match,
// but its typings only accept a string
// biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
const isImage = (mime: Mime) => /^image/.test(mime as any)
// biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
const isAudio = (mime: Mime) => /^audio/.test(mime as any)
// biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
const isVideo = (mime: Mime) => /^video/.test(mime as any)
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
