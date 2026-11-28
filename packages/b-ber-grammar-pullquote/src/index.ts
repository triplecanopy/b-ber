// pullquote and blockquote. Their closes are drawn by `close`, from
// b-ber-markdown-renderer's directive rule, which knows which block an exit
// closes (TASK-175). The citation is read from the opener's line there; it
// used to be kept in module-level state between the open and the close

import {
  attributesObject,
  attributesString,
  parseAttrs,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import type {
  DirectiveToken,
  RendererContext,
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

// Optional so the tests can render without a file
type Context = Partial<RendererContext>

function handleOpen(
  token: RegExpMatchArray,
  fileName: string,
  lineNumber: number | null
) {
  // the pullquote opens
  const [, type, id, attrs] = token

  // parse attrs as normal
  const attrsObject = attributesObject(attrs, type, { fileName, lineNumber })

  // The citation is drawn by `close`
  if (has(attrsObject, 'citation')) {
    // `has` narrows `citation` to a required key, which `delete` rejects
    delete (attrsObject as Record<string, string>).citation
  }

  const attrsString = attributesString(attrsObject)
  const elementName = type === 'pullquote' ? 'section' : 'blockquote'
  const comment = `<!-- START: section:${type}#${id} -->`

  return `${comment}<${elementName}${attrsString}>`
}

function cite(text: string) {
  return `<footer><cite>&#8212;&#160;${text}</cite></footer>`
}

// A pullquote or blockquote being closed, from the directive rule's node
export interface ClosingBlock {
  name: string
  id: string
  // The opener's line after the fence, which holds the citation
  info: string
}

// The markup that closes a pullquote or blockquote, with its citation
const close =
  (instance: RendererInstance) =>
  (block: ClosingBlock): string => {
    const { name, id, info } = block
    // An opener with `exit` in its line drew no open (see `render`), so it
    // draws no close either
    if (info.trim().match(MARKER_CLOSE_RE)) return ''
    const elementName = name === 'pullquote' ? 'section' : 'blockquote'
    const [, , , attrs] = info.trim().match(MARKER_OPEN_RE) ?? []
    // Read as `attributesObject` read it, without its warnings, which the
    // opener already gave
    const { citation } = parseAttrs((attrs ?? '').trim())
    const comment = `<!-- END: section:${name}#${id} -->`

    return `
        ${citation ? cite(instance.renderInline(citation)) : ''}
        </${elementName}>${comment}
    `
  }

const validateOpen =
  ({ context }: { context: Context }) =>
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

const render =
  ({ context }: { context: Context }) =>
  (tokens: DirectiveToken[], idx: number) => {
    const fileName = `_markdown/${context.fileName}.md`
    const lineNumber = tokens[idx].map ? tokens[idx].map[0] : null
    const token = tokens[idx].info.trim()

    // Closes are drawn by `close`
    if (tokens[idx].nesting !== 1) return ''

    // MARKER_CLOSE_RE is unanchored, so an opener with `exit` anywhere in its
    // line was taken for an exit, and drew nothing. It still draws nothing
    const tokenOpen = token.match(MARKER_OPEN_RE)
    const tokenClose = token.match(MARKER_CLOSE_RE)

    return tokenClose || !tokenOpen
      ? ''
      : handleOpen(tokenOpen, fileName, lineNumber)
  }

export default {
  plugin,
  name: 'pullQuote',
  renderer: ({
    instance,
    context,
  }: {
    instance: RendererInstance
    context: Context
  }) => ({
    marker: BLOCK_DIRECTIVE_MARKER,
    minMarkers: BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
    markerOpen: MARKER_OPEN_RE,
    markerClose: MARKER_CLOSE_RE,
    validateOpen: validateOpen({ context }),
    render: render({ context }),
    close: close(instance),
  }),
}
