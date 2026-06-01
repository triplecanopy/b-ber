import log from '@canopycanopycanopy/b-ber-logger'
import {
  INLINE_DIRECTIVE_FENCE,
  SECONDARY_INLINE_DIRECTIVE_FENCE_OPEN,
  SECONDARY_INLINE_DIRECTIVE_FENCE_CLOSE,
} from '@canopycanopycanopy/b-ber-shapes-directives'

export const throMissingBuildTypeError = ({ id, build }) => {
  let message = `Missing build type [${build}] in media.yml for the ID [${id}].`
  message += ' '
  message +=
    'Ensure that the media.yml file exists and contains the properties for each build type.'
  log.error(message)
}

export const throwMissingIDError = ({ id }) => {
  let message = `Missing ID [${id}] in media.yml.`
  message += ' '
  message +=
    'Ensure that the media.yml file exists and contains the correct IDs.'
  log.error(message)
}

export const createAttributesString = data =>
  Object.entries(data)
    .reduce((acc, [key, value]) => acc.concat(`${key}:"${value}" `), '')
    .trim()

export const createDirectiveString = ({
  type,
  modifier,
  id,
  caption,
  rest,
}) => {
  const attributes = createAttributesString(rest)
  let directive = `${INLINE_DIRECTIVE_FENCE}${type}${modifier}:${id} ${attributes}`
  if (caption) {
    directive += `\n${SECONDARY_INLINE_DIRECTIVE_FENCE_OPEN}`
    directive += caption
    directive += `\n${SECONDARY_INLINE_DIRECTIVE_FENCE_CLOSE}`
    directive += '\n\n'
  }

  return directive
}
