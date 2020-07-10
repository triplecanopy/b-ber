import { createUnsupportedInline } from '@canopycanopycanopy/b-ber-lib/utils'
import state from '@canopycanopycanopy/b-ber-lib/State'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import figure from '@canopycanopycanopy/b-ber-parser-figure'
import { createIframe, createIframeInline, prepare, supported } from './helpers'

const MARKER_RE = /^(iframe)/
const DIRECTIVE_RE = /(iframe(?:-inline)?)(?::([^\s]+)(\s+.*)?)?$/

const render = ({ instance, context }) => (tokens, index) => {
  const token = tokens[index]
  const marker = token.info.trim().match(DIRECTIVE_RE)
  if (!marker) return ''

  const fileName = `_markdown/${context.fileName}.md`
  const lineNumber = token.map ? token.map[0] : null
  const type = marker[1]
  const args = prepare({
    token,
    marker,
    context,
    instance,
    fileName,
    lineNumber,
  })

  switch (type) {
    // Render the linked image and add the figure to state so that it's rendered
    // in the LOI
    case 'iframe':
      state.add('figures', args)
      return createIframe(args)

    // Render an inline iframe embed, or an unsupported message if not
    // running a reader or web build
    case 'iframe-inline':
      return supported(state.build)
        ? createIframeInline(args)
        : createUnsupportedInline(args)

    default:
      throw new Error(
        `Something went wrong parsing [${args.type}] in [${context.fileName}]`
      )
  }
}

export default {
  plugin: figure,
  name: 'iframe',
  renderer: ({ instance, context }) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    validate: params => params.trim().match(MARKER_RE),
    render: render({ instance, context }),
  }),
}
