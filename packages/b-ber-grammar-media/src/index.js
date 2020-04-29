import state from '@canopycanopycanopy/b-ber-lib/State'
import {
  INLINE_DIRECTIVE_FENCE,
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import {
  throMissingBuildTypeError,
  throwMissingIDError,
  createDirectiveString,
} from './helpers'

const DIRECTIVE_REGEXP = /^media(?:-inline)?$/

// Render replacement Markdown string
function replace({ type, id, build, str, begin, end }) {
  const { type: nextType, caption, ...rest } = state.media[id][build]

  // Check if the replacement directive will be an inline directive based on
  // whether the original directive was `media` or `media-inline`
  const modifier = /-/.test(type) ? `-${type.split('-')[1]}` : ''

  // Create replacement directive from media.yml
  const replacement = createDirectiveString({
    type: nextType,
    id,
    modifier,
    caption,
    rest,
  })

  // Do replacement and update delta
  const originalLength = end - begin
  const replacementLength = replacement.length

  const nextStr = `${str.slice(0, begin)}${replacement}${str.slice(end)}`
  const nextDelta = replacementLength - originalLength

  return { str: nextStr, delta: nextDelta }
}

// Parse the Markdown. Inject directives to replace the `media`/`media-inline`
// directives. Returns an updated Markdown string
function render(data) {
  let str = data

  const { build } = state
  const lines = []

  // TODO current fence in b-ber-shapes includes whitespace, should remove that.
  // Accounting for whitespace in `fenceLength` below
  const fenceLength = INLINE_DIRECTIVE_MARKER_MIN_LENGTH + 1
  const fenceCharCode = INLINE_DIRECTIVE_MARKER.charCodeAt(0)
  const fence = INLINE_DIRECTIVE_FENCE

  const newlineCharCode = 0x0a

  // Create a map of the start/end indices of each line in the file.
  let lineStart = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i].charCodeAt(0) === newlineCharCode) {
      lines.push([lineStart, i])
      lineStart = i + 1
    }

    // Add markers in case there's only one line in the file with no trailing
    // newline
    if (i === str.length - 1 && str.length && !lines.length) {
      lines.push([0, i + 1])
    }
  }

  // Move through the file replacing entire lines if the match the `media` or
  // `media-inline` directive. Account for the change in line start/end
  // positions by storing a delta of the length of content added vs. removed
  let delta = 0
  for (let i = 0; i < lines.length; i++) {
    let [begin, end] = lines[i]

    begin += delta
    end += delta

    // eslint-disable-next-line no-continue
    if (str.charCodeAt(begin) !== fenceCharCode) continue
    // eslint-disable-next-line no-continue
    if (str.slice(begin, begin + fenceLength) !== fence) continue

    const directive = str.slice(begin + fenceLength, end).trim()
    const [type, id] = directive.split(':')

    // Check that the directive is a `media`/`media-inline` directive
    // eslint-disable-next-line no-continue
    if (DIRECTIVE_REGEXP.test(type) !== true) continue

    if (!state.media[id]) throwMissingIDError({ id, build })
    if (!state.media[id][build]) throMissingBuildTypeError({ id, build })

    const nextDocumentData = replace({ type, id, build, str, begin, end })

    // eslint-disable-next-line prefer-destructuring
    str = nextDocumentData.str
    delta += nextDocumentData.delta
  }

  return str
}

export default { render }
