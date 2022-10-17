import isUndefined from 'lodash.isundefined'

/* eslint-disable  no-param-reassign */

const figurePlugin = (md, name, options = {}) => {
  const minMarkers = /*options.minMarkers || */ 3
  const markerStr = /*options.marker || */ ':'
  const markerChar = markerStr.charCodeAt(0)
  const markerLen = markerStr.length
  const { validate, render } = options

  function container(state, startLine, endLine, silent) {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    let pos
    let nextLine
    let token

    // Check out the first character quickly,
    // this should filter out most of non-containers
    if (markerChar !== state.src.charCodeAt(start)) return false

    // Check out the rest of the marker string
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
    if (!validate(params, state.line + 1)) return false

    // Since start is found, we can report success here in validation mode
    if (silent) return true

    // Search for the end of the block
    nextLine = startLine

    // check to see if the image is followed by a caption
    // - increment to next line
    // - check chars at pos to see if they match caption start
    // if not, continue

    const _capMarkerLen = minMarkers - 1

    let _capStartPos
    let _capEndPos
    let _capEndLine
    let _fastForward

    let _capBody

    let _cursor

    for (;;) {
      // images can either be self-closing (i.e., they close when another
      // directive begins, or the parser hits EOF), and can also contain
      // captions, delimited by two colons (::) after opening the image
      // directive.
      nextLine += 1

      if (nextLine >= endLine) break // EOF

      // we only check the following line for markers, so whitespace is
      // significant for image captions. this can be relaxed, but it's more
      // performant this way.
      //
      // there is no caption (open or close); exit and output only the markup
      // for figure
      if (state.src[state.bMarks[nextLine]].charCodeAt(0) !== markerChar) {
        break
      }

      // capture the current character
      _cursor = state.bMarks[nextLine]

      // this is sort of inelegant, but it's an easy way to fake a lookahead
      const _currChar = state.src[_cursor].charCodeAt(0)
      const _nextChar = state.src[_cursor + 1].charCodeAt(0)

      // two markers on the next line mean that there's a caption
      if (_currChar === markerChar && _nextChar === markerChar) {
        if (isUndefined(_capStartPos)) {
          _capStartPos = _cursor + _capMarkerLen // state the start index
        } else if (!isUndefined(_capStartPos)) {
          // a caption is being captured, so we know we're still in the
          // opening image marker

          // eslint-disable-next-line
          _capEndPos = _cursor + 2 - _capMarkerLen // state the end index
          _capEndLine = _cursor
          break
        }
      }
    }

    // then,
    // - slice the string from src at beginning and end
    // - add it to the image token so that it can be parsed in `render` method

    if (_capStartPos && _capEndPos) {
      // we have both a beginning and end marker for the caption, so we can
      // advance the cursor for further parsing
      _capBody = state.src.slice(_capStartPos, _capEndPos)
      _fastForward = state.bMarks.indexOf(_capEndLine) + 1
    } else {
      // there's no caption, but we've advanced the cursor, so we just rewind
      // it to where it initially matched our image directive
      nextLine = startLine + 1
    }

    // this will prevent lazy continuations from ever going past our end marker
    // state.lineMax  = nextLine
    token = state.push(`container_${name}_open`, 'div', 1)
    token.markup = markup
    token.block = true
    token.info = params
    token.children = _capBody
    token.map = [startLine, nextLine]

    // add ending token since we're using a `container` plugin as an inline
    token = state.push(`container_${name}_close`, 'div', -1)

    // then,
    // - increment the pointer to the caption end if applicable
    state.line = _fastForward || nextLine

    return true
  }

  md.block.ruler.before('fence', `container_${name}`, container, {
    alt: ['paragraph', 'reference', 'blockquote'],
  })
  md.renderer.rules[`container_${name}_open`] = render
  md.renderer.rules[`container_${name}_close`] = render // not used, but keeping things consistent
}

export default figurePlugin
