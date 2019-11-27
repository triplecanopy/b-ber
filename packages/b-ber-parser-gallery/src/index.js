/* eslint-disable no-param-reassign,no-continue */

/*!
An adapted version of markdown-it-container 2.0.0
https://github.com//markdown-it/markdown-it-container
MIT license
*/

import path from 'path'
import _state from '@canopycanopycanopy/b-ber-lib/State'
import mime from 'mime-types'
import {
  htmlId,
  parseAttrs,
  toAlias,
} from '@canopycanopycanopy/b-ber-grammar-attributes'

const addCaption = (md, t, attrs) => {
  if (!attrs.caption) return

  t.children.push(
    {
      type: 'block',
      tag: 'div',
      attrs: [
        ['class', 'figcaption'],
        ['data-caption', htmlId(attrs.source)],
      ],
      nesting: 1,
    },
    {
      type: 'block',
      tag: 'p',
      attrs: [['class', 'small']],
      nesting: 1,
    },

    ...md.parseInline(attrs.caption, {})[0].children,

    {
      type: 'block',
      tag: 'p',
      nesting: -1,
    },
    {
      type: 'block',
      tag: 'div',
      nesting: -1,
    }
  )
}

const createImageElement = (tok, attrs) => {
  tok.content = ''
  tok.children.push({
    type: 'inline',
    tag: 'img',
    attrs: [
      ['data-image', htmlId(attrs.source)],
      ['src', `../images/${encodeURIComponent(attrs.source)}`],
      ['alt', attrs.alt || attrs.source],
    ],
    nesting: 0,
  })
}

const createMediaElement = (tok, attrs) => {
  const media = [..._state[attrs.type]]
  const supportedMediaAttrs = {
    audio: ['controls', 'loop'],
    video: ['controls', 'loop', 'fullscreen'],
  }

  const sources = media.filter(a => toAlias(a) === attrs.source)
  const mediaAttrs = [[`data-${attrs.type}`, htmlId(attrs.source)]]

  if (attrs.poster) mediaAttrs.push(['poster', `../images/${attrs.poster}`])

  // add boolean attrs
  supportedMediaAttrs[attrs.type].forEach(a => {
    if (attrs[a]) mediaAttrs.push([a, a])
  })

  tok.content = ''
  tok.children.push(
    {
      type: 'block',
      tag: 'section',
      attrs: [['class', attrs.type]],
      nesting: 1,
    },
    {
      type: 'block',
      tag: attrs.type,
      attrs: mediaAttrs,
      nesting: 1,
    }
  )

  sources.forEach(source => {
    tok.children.push({
      type: 'inline',
      tag: 'source',
      attrs: [
        ['src', `../media/${path.basename(source)}`],
        ['type', mime.lookup(source)],
      ],
      nesting: 0,
    })
  })

  tok.children.push(
    {
      type: 'block',
      tag: attrs.type,
      nesting: -1,
    },
    {
      type: 'inline', // controls. TODO: add to media core directive
      tag: 'button',
      attrs: [
        ['data-media-type', attrs.type],
        ['data-media-controls', htmlId(attrs.source)],
        ['class', 'media__controls media__controls--play'],
      ],
      nesting: 0,
    },
    {
      type: 'block',
      tag: 'section',
      nesting: -1,
    }
  )
}

const containerPlugin = (md, name, options = {}) => {
  const minMarkers = options.minMarkers || 3
  const markerStr = options.marker || ':'
  const markerChar = markerStr.charCodeAt(0)
  const markerLen = markerStr.length
  const { validateOpen, render } = options

  function container(state, startLine, endLine, silent) {
    const lineNumber = startLine + 1

    let pos
    let nextLine
    let token
    let autoClosed = false
    let start = state.bMarks[startLine] + state.tShift[startLine]
    let max = state.eMarks[startLine]

    if (markerChar !== state.src.charCodeAt(start)) return false

    // Check out the rest of the marker string, i.e., count the number of markers
    for (pos = start + 1; pos <= max; pos++) {
      if (markerStr[(pos - start) % markerLen] !== state.src[pos]) {
        break
      }
    }

    const markerCount = Math.floor((pos - start) / markerLen)
    if (markerCount < minMarkers) return false

    pos -= (pos - start) % markerLen
    const markup = state.src.slice(start, pos)
    const params = state.src.slice(pos, max)

    if (
      !validateOpen(
        params,
        lineNumber
      ) /* && !validateClose(params, lineNumber)*/
    ) {
      return false
    }
    if (silent) return true // for testing validation

    nextLine = startLine

    // look for closing block
    for (;;) {
      nextLine += 1

      if (nextLine >= endLine) break // unclosed block is autoclosed by end of document

      start = state.bMarks[nextLine] + state.tShift[nextLine]
      max = state.eMarks[nextLine]

      if (state.sCount[nextLine] - state.blkIndent >= 4) continue // closing fence must be indented less than 4 spaces
      if (Math.floor((pos - start) / markerLen) < markerCount) continue
      if (pos < max) continue

      autoClosed = true

      break
    }

    const oldParent = state.parentType
    const oldLineMax = state.lineMax
    state.parentType = 'container'

    // this will prevent lazy continuations from ever going past our end marker
    state.lineMax = nextLine

    token = state.push(`container_${name}_open`, 'div', 1)
    token.markup = markup
    token.block = true
    token.info = params
    token.map = [startLine, nextLine]

    state.md.block.tokenize(state, startLine + 1, nextLine)

    token = state.push(`container_${name}_close`, 'div', -1)
    token.markup = state.src.slice(start, pos)
    token.block = true

    state.parentType = oldParent
    state.lineMax = oldLineMax
    state.line = nextLine + (autoClosed ? 1 : 0)

    // parse child tokens
    // set a flag so that we don't render other directives' children which may use the same syntax
    let childOfGallery = false
    state.tokens.forEach((tok, i) => {
      if (tok.type === 'container_gallery_open') childOfGallery = true
      if (tok.type === 'container_gallery_close') childOfGallery = false

      if (tok.type === 'inline' && childOfGallery) {
        const matchedContent = tok.content.match(/^(::\s?(.+)\s?::)/)
        if (matchedContent) {
          const attrs = parseAttrs(matchedContent[1])
          const prev = state.tokens[i - 1]
          const next = state.tokens[i + 1]

          prev.tag = 'div'
          prev.attrSet('class', 'gallery__item')
          prev.attrSet('data-gallery-item', attrs.item)

          next.tag = 'div'

          switch (attrs.type) {
            case 'image':
              createImageElement(tok, attrs)
              addCaption(md, tok, attrs)
              break

            case 'video':
            case 'audio':
              createMediaElement(tok, attrs)
              addCaption(md, tok, attrs)
              break

            default:
              break
          }
        }
      }
    })

    return true
  }

  md.block.ruler.before('fence', `container_${name}`, container, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules[`container_${name}_open`] = render
  md.renderer.rules[`container_${name}_close`] = render
}

export default containerPlugin
