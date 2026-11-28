// pullquote and blockquote, each built whole as elements (TASK-176), where
// b-ber-markdown-renderer's directive rule closes it (TASK-175)

import {
  attributesList,
  attributesObject,
  parseAttrs,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import type {
  BlockRender,
  RendererInstance,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import plugin from '@canopycanopycanopy/b-ber-parser-section'
import {
  BLOCK_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import has from 'lodash/has'
import isUndefined from 'lodash/isUndefined'

const MARKER_OPEN_RE = /^(pullquote|blockquote|exit)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /(exit)(?::([\s]+))?/

// The file `validateOpen` names. Only b-ber-parser-section's plugin calls
// it, which the build no longer registers (TASK-175)
type Context = { fileName?: string }

// The opener's attributes, without the citation, which goes in the footer
function openAttributes(
  type: string,
  attrs: string | undefined,
  fileName: string,
  lineNumber: number
) {
  const attrsObject = attributesObject(attrs, type, { fileName, lineNumber })

  // The citation is drawn in the footer
  if (has(attrsObject, 'citation')) {
    // `has` narrows `citation` to a required key, which `delete` rejects
    delete (attrsObject as Record<string, string>).citation
  }

  return attributesList(attrsObject)
}

const validateOpen =
  ({ context = {} }: { context?: Context }) =>
  (params: string, line: number) => {
    const match = params.trim().match(MARKER_OPEN_RE)
    if (!match || match.length < 3) return false

    const [, type, id] = match
    if (isUndefined(id)) {
      throw log.error(
        `Missing [id] for [${type}:start] at ${context.fileName}.md:${line}`
      )
    }

    return true
  }

// A pullquote or blockquote, built whole: its start comment, the element
// with its children and the citation's footer, and its end comment. The
// citation is read from the opener's line; it used to be kept in
// module-level state between the open and the close
const render =
  (instance: RendererInstance): BlockRender =>
  ({ node, env, h }) => {
    const fileName = `_markdown/${env.document.fileName}.md`
    const marker = node.info.trim()

    // An opener with `exit` anywhere in its line is a pullquote: the exit
    // was matched anywhere in the line, and the block drew neither its open
    // nor its close (TASK-174's quirk 2). The directive rule tells exits from
    // openers, and claims only the lines MARKER_OPEN_RE matches
    const tokenOpen = marker.match(MARKER_OPEN_RE)
    if (!tokenOpen) return (children) => h.fragment(children)

    const [, type, id, attrs] = tokenOpen
    const attributes = openAttributes(type, attrs, fileName, node.line)
    const elementName = type === 'pullquote' ? 'section' : 'blockquote'

    return (children) => {
      // Read as `attributesObject` read it, without its warnings, which the
      // opener already gave
      const { citation } = parseAttrs((attrs ?? '').trim())
      const footer = citation
        ? h('footer', null, [
            h('cite', null, [
              h.raw('&#8212;&#160;'),
              h.raw(instance.renderInline(citation, env)),
            ]),
          ])
        : null

      return h.fragment([
        h.comment(`START: section:${type}#${id}`),
        h(elementName, attributes, [
          ...children,
          '\n        ',
          footer,
          '\n        ',
        ]),
        h.comment(`END: section:${node.name}#${node.id}`),
        '\n    ',
      ])
    }
  }

export default {
  plugin,
  name: 'pullQuote',
  renderer: ({
    instance,
    context,
  }: {
    instance: RendererInstance
    context?: Context
  }) => ({
    marker: BLOCK_DIRECTIVE_MARKER,
    minMarkers: BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
    markerOpen: MARKER_OPEN_RE,
    markerClose: MARKER_CLOSE_RE,
    validateOpen: validateOpen({ context }),
    render: render(instance),
  }),
}
