import type {
  InlineRender,
  RendererReference,
} from '@canopycanopycanopy/b-ber-lib'
import figure from '@canopycanopycanopy/b-ber-parser-figure'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import {
  createIframe,
  createIframeInline,
  createUnsupportedInline,
  prepare,
} from './helpers'

const MARKER_RE = /^(iframe)/
const DIRECTIVE_RE = /(iframe(?:-inline)?)(?::([^\s]+)(\s+.*)?)?$/

const render =
  ({ instance }: RendererReference): InlineRender =>
  ({ node, env, h }) => {
    const marker = node.info.trim().match(DIRECTIVE_RE)
    if (!marker) return h.fragment([])

    const fileName = `_markdown/${env.document.fileName}.md`
    const lineNumber = node.line
    const type = marker[1]
    const args = prepare({
      node,
      marker,
      env,
      instance,
      fileName,
      lineNumber,
    })

    switch (type) {
      // Render the linked image and collect the figure so that it's rendered
      // in the LOI
      case 'iframe':
        env.result.figures.push(args)
        return createIframe(args, h)

      // Render an inline iframe embed, or an unsupported message where the
      // target has no live embeds
      case 'iframe-inline':
        return env.document.target.features.liveEmbeds
          ? createIframeInline(args, h)
          : createUnsupportedInline(args, h)

      default:
        throw new Error(
          `Something went wrong parsing [${args.type}] in [${env.document.fileName}]`
        )
    }
  }

export default {
  plugin: figure,
  name: 'iframe',
  renderer: ({ instance }: RendererReference) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    validate: (params: string) => params.trim().match(MARKER_RE),
    render: render({ instance }),
  }),
}
