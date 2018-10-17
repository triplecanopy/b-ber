/* eslint-disable camelcase, one-var, prefer-const, no-param-reassign, no-multi-spaces, no-continue */
const figurePlugin = (md, name, options = {}) => {
    const min_markers = /*options.minMarkers || */ 3
    const marker_str = /*options.marker || */ ':'
    const marker_char = marker_str.charCodeAt(0)
    const marker_len = marker_str.length
    const validate = options.validate
    const render = options.render

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
            if (
                state.src[state.bMarks[nextLine]].charCodeAt(0) !== marker_char
            ) {
                break
            }

            // capture the current character
            _cursor = state.bMarks[nextLine]

            // this is sort of inelegant, but it's an easy way to fake a lookahead
            let _curr_char = state.src[_cursor].charCodeAt(0)
            let _next_char = state.src[_cursor + 1].charCodeAt(0)

            // two markers on the next line mean that there's a caption
            if (_curr_char === marker_char && _next_char === marker_char) {
                if (typeof _caption_start_pos === 'undefined') {
                    _caption_start_pos = _cursor + _cap_marker_len // state the start index
                } else if (typeof _caption_start_pos !== 'undefined') {
                    // a caption is being captured, so we know we're still in the
                    // opening image marker

                    // eslint-disable-next-line
                    _caption_end_pos = _cursor + 2 - _cap_marker_len // state the end index
                    _caption_end_line = _cursor
                    break
                }
            }
        }

        // then,
        // - slice the string from src at beginning and end
        // - add it to the image token so that it can be parsed in `render` method

        if (_caption_start_pos && _caption_end_pos) {
            // we have both a beginning and end marker for the caption, so we can
            // advance the cursor for further parsing
            _caption_body = state.src.slice(
                _caption_start_pos,
                _caption_end_pos,
            )
            _fast_forward = state.bMarks.indexOf(_caption_end_line) + 1
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
        token.children = _caption_body
        token.map = [startLine, nextLine]

        // add ending token since we're using a `container` plugin as an inline
        token = state.push(`container_${name}_close`, 'div', -1)

        // then,
        // - increment the pointer to the caption end if applicable
        state.line = _fast_forward || nextLine

        return true
    }

    md.block.ruler.before('fence', `container_${name}`, container, {
        alt: ['paragraph', 'reference', 'blockquote', 'list'],
    })
    md.renderer.rules[`container_${name}_open`] = render
    md.renderer.rules[`container_${name}_close`] = render // not used, but keeping things consistent
}

export default figurePlugin
