
/* eslint-disable */

const container_plugin = (md, name, options = {}) => {

  const marker_open = options.markerOpen
  const marker_close = options.markerClose
  const min_markers = options.minMarkers || 1
  const marker_str = options.marker || '+'
  const marker_char = marker_str.charCodeAt(0)
  const marker_len = marker_str.length
  const validate = options.validate
  const replacementStr = options.replacementStr
  const render = options.render || renderDefault

  const validateDefault = () =>
    params.trim().split(' ', 2)[0] === name

  const renderDefault = (tokens, idx, opts, env, self) =>
    self.renderToken(tokens, idx, opts, env, self)


  const validateInline = (arr, str) =>
    arr.filter(_ => _.test(str))[0]


  const markerTokenToString = regex =>
    regex.toString().replace(/[\/\^()]/g, '')

  const stripMarker = str =>
    str.replace(markerTokenToString(marker_open), '').trim()

  const getInlineDelimitersFromParams = params => {
    const delims = stripMarker(params).replace(/['"]/g, '')
    return delims.split(' ').map(_ => new RegExp(`^(${_.trim()})`)).filter(Boolean)
  }

  const container = (state, startLine, endLine, silent) => {
    const inlineTokens = []
    let pos, nextLine, marker_count, markup, params, token, old_parent, old_line_max, match, inlineRegExp
    let auto_closed = false
    let start = state.bMarks[startLine] + state.tShift[startLine]
    let max = state.eMarks[startLine]

    // startLine - char position of line start
    // state.bMarks - line begin offsets for fast jumps
    // state.eMarks - line end offsets for fast jumps
    // state.tShift - offsets of the first non-space characters (tabs not expanded)
    // state.sCount - indents for each line (tabs expanded)

    // Check out the rest of the marker string, i.e., count the number of markers
    for (pos = start + 1; pos <= max; pos++) {
      if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
        break
      }
    }

    // test if there are enough markers when one's found
    marker_count = Math.floor((pos - start) / marker_len)
    if (marker_count < min_markers) { return false }

    // move cursor next to marker
    pos -= (pos - start) % marker_len

    // get block element parameters
    markup = state.src.slice(start, pos)
    params = state.src.slice(pos, max)

    // validate params, i.e., test if we should begin rendering the element
    if (!validate(params)) { return false }

    // validate in test mode
    if (silent) { return true }

    // start parsing block element body
    nextLine = startLine
    for (;;) {
      nextLine += 1

      // Boilerplate: unclosed block should be autoclosed by end of document.
      // also block seems to be autoclosed by end of parent
      if (nextLine >= endLine) { break }

      // Boilerplate: advance cursor to next line?
      start = state.bMarks[nextLine] + state.tShift[nextLine]
      max = state.eMarks[nextLine]

      // check if we found a nested directive. we're only interested in `exit`
      if (state.src.charCodeAt(start) === marker_char) {
        // check if it's an `exit` directive
        if (marker_close.exec(state.src.slice(start + marker_len, max).trim())) { break }
      }

      // Create regular expressions from paramaters of `dialogue` directive
      const delims = getInlineDelimitersFromParams(params)
      const inlineStr = state.src.slice(start, max)
      if (inlineRegExp = validateInline(delims, inlineStr)) {

        // simple string replace function is executed after the md has been fully processed
        options.context.nestedStrings.push({
          find: inlineStr,
          repl: inlineStr.replace(inlineRegExp, replacementStr),
        })
      }

      // Boilerplate: closing fence should be indented less than 4 spaces
      if (state.sCount[nextLine] - state.blkIndent >= 4) { continue }

      // Boilerplate: what's this doing?
      if (Math.floor((pos - start) / marker_len) < marker_count) { continue }

      // Boilerplate: move cursor forward?
      if (pos < max) { continue }

      // Boilerplate: auto-close the block element if we reach the end of the file
      auto_closed = true

      // Boilerplate: finished parsing block
      break
    }

    //
    // Boilerplate
    //

    old_parent       = state.parentType
    old_line_max     = state.lineMax
    state.parentType = 'container'

    // this will prevent lazy continuations from ever going past our end marker
    state.lineMax    = nextLine

    token            = state.push('container_' + name + '_open', 'div', 1)
    token.markup     = markup
    token.block      = true
    token.info       = params
    token.map        = [startLine, nextLine]

    token.children   = inlineTokens

    state.md.block.tokenize(state, startLine + 1, nextLine)

    token            = state.push('container_' + name + '_close', 'div', -1)
    token.markup     = state.src.slice(start, pos) + ' exit section'
    token.block      = true

    state.parentType = old_parent
    state.lineMax    = old_line_max
    state.line       = nextLine + (auto_closed ? 1 : 0)

    return true
  }

  md.block.ruler.before('fence', 'container_' + name, container, {
    alt: [ 'paragraph', 'reference', 'blockquote', 'list' ]
  })
  md.renderer.rules['container_' + name + '_open'] = render
  md.renderer.rules['container_' + name + '_close'] = render
}

export default container_plugin
