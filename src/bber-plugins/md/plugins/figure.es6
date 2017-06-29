/* eslint-disable camelcase, one-var, prefer-const, no-param-reassign, no-multi-spaces, no-continue */
const figurePlugin = (md, name, options = {}) => {
  const min_markers = /*options.minMarkers || */ 3
  const marker_str  = /*options.marker || */ ':'
  const marker_char = marker_str.charCodeAt(0)
  const marker_len  = marker_str.length
  const validate    = options.validate
  const render      = options.render

  function container(state, startLine, endLine, silent) {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    let pos, nextLine, marker_count, markup, params, token

    // Check out the first character quickly,
    // this should filter out most of non-containers
    if (marker_char !== state.src.charCodeAt(start)) return false

    // Check out the rest of the marker string
    for (pos = start + 1; pos <= max; pos++) {
      if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
        break
      }
    }

    marker_count = Math.floor((pos - start) / marker_len)
    if (marker_count < min_markers) return false
    pos -= (pos - start) % marker_len

    markup = state.src.slice(start, pos)
    params = state.src.slice(pos, max)
    if (!validate(params, state.line + 1)) return false
    // Since start is found, we can report success here in validation mode
    if (silent) return true


    // Search for the end of the block
    nextLine = startLine

    // check to see if the image is followed by a caption
    // - increment to next line
    // - check chars at pos to see if they match caption start
    // if not, continue

    let _cap_marker_len = min_markers - 1

    let _caption_start_pos
    let _caption_end_pos
    let _caption_end_line
    let _fast_forward

    let _caption_body

    let _cursor

    for (;;) {
      // images can either be self-closing (i.e., they close when another
      // directive begins, or the parser hits EOF), or can be explicitly
      // `exit`ed. they can also contain captions, delimited by two colons
      // (::) after opening the image directive. when they contain captions,
      // they *must* be explicitly closed with an `exit`.
      nextLine += 1

      if (nextLine >= endLine) break // EOF

      if (state.src[state.bMarks[nextLine]].charCodeAt(0) !== marker_char) continue

      _cursor = state.bMarks[nextLine]

      // this is sort of inelegant, but it's an easy way to fake a lookahead
      let _one_after = state.src[_cursor + 1].charCodeAt(0)
      let _two_after = state.src[_cursor + 2].charCodeAt(0)

      // exactly two markers means we have a caption
      if (_one_after === marker_char && _two_after !== marker_char) {
        _caption_start_pos = _cursor + _cap_marker_len // store the start index
      }

      // three (or more ...) markers either means an `exit`, or the start of
      // a new directive
      if (_one_after === marker_char && _two_after === marker_char) {
        if (typeof _caption_start_pos !== 'undefined') {
          // a caption is being captured, so we know we're still in the opening image marker
          _caption_end_pos = (_cursor + 2) - _cap_marker_len // store the end index
          _caption_end_line = _cursor
        } else {
          // it's either an `exit`, or the start of a new directive. we'll
          // need to keep parsing the document, so we rewind the current line
          // to start the next pass, since we already know that there's a
          // directive at our current position
          nextLine -= 1
        }
        // whatever happened above, we're finished with the image directive at
        // this point
        break
      }
    }

    // then,
    // - slice the string from src at beginning and end
    // - add it to the image token so that it can be parsed in `render` method

    if (_caption_start_pos && _caption_end_pos) {
      _caption_body = state.src.slice(_caption_start_pos, _caption_end_pos)
      _fast_forward = state.bMarks.indexOf(_caption_end_line) + 1
    }

    // this will prevent lazy continuations from ever going past our end marker
    state.lineMax  = nextLine
    token          = state.push(`container_${name}_open`, 'div', 1)
    token.markup   = markup
    token.block    = true
    token.info     = params
    token.children = _caption_body
    token.map      = [startLine, nextLine]

    // then,
    // - increment the pointer to the caption end if applicable
    state.line     = _fast_forward || nextLine + 1

    return true
  }

  md.block.ruler.before('fence', `container_${name}`, container, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules[`container_${name}_open`] = render
  md.renderer.rules[`container_${name}_close`] = render // not used, but keeping things consistent
}

export default figurePlugin
