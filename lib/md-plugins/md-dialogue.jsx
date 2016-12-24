
/* eslint-disable */


const container_plugin = (md, name, options = {}) => {

  const marker_open = options.markerOpen
  const marker_close = options.markerClose
  const min_markers = options.minMarkers || 1
  const marker_str = options.marker || '+'
  const marker_char = marker_str.charCodeAt(0)
  const marker_len = marker_str.length
  const validate = options.validate
  const render = options.render || renderDefault
  const replacement = options.replacement || '<span class="speaker">$1</span>'

  const validateDefault = () =>
    params.trim().split(' ', 2)[0] === name

  const renderDefault = (tokens, idx, opts, env, self) =>
    self.renderToken(tokens, idx, opts, env, self)


  // const validateInlineDelimiter = value => inlineDelimiters.some(_ => _.test(value))

  const parseInlineDelimiter = (md, ruleName, tokenType, iteartor) => {
    const scan = (state) => {
      let i, blkIdx, inlineTokens
      for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx -= 1) {
        if (state.tokens[blkIdx].type !== 'inline') { continue }
        inlineTokens = state.tokens[blkIdx].children
        for (i = inlineTokens.length - 1; i >= 0; i -= 1) {
          if (inlineTokens[i].type !== tokenType) { continue }
          iteartor(inlineTokens, i)
        }
      }
    }
    md.core.ruler.push(ruleName, scan)
  }

  const initializeInlineDelimiterRule = (ruleName, regExp, replacement) =>
    parseInlineDelimiter(md, ruleName, 'text', (tokens, idx) => {
      tokens[idx].content = tokens[idx].content.replace(regExp, replacement)
    })

  const getInlineDelimitersFromParams = str =>
    str.split(' ').map(_ => new RegExp(`^${_.trim()}`)).filter(Boolean)

  const registerInlineDelimiterRule = arr =>
    arr.map(_ => initializeInlineDelimiterRule(String(_), _, inlineReplacement))

  const container = (state, startLine, endLine, silent) => {
    const inlineTokens = []
    let pos, nextLine, marker_count, markup, params, token, old_parent, old_line_max, match
    let auto_closed = false
    let start = state.bMarks[startLine] + state.tShift[startLine]
    let max = state.eMarks[startLine]

    // console.log('startLine', startLine) // char position of line start
    // console.log('state.bMarks', state.bMarks) // line begin offsets for fast jumps
    // console.log('state.eMarks', state.eMarks) // line end offsets for fast jumps
    // console.log('state.tShift', state.tShift) // offsets of the first non-space characters (tabs not expanded)
    // console.log('state.sCount', state.sCount) // indents for each line (tabs expanded)

    // break early if the first char on the line doesn't match the marker
    if (marker_char !== state.src.charCodeAt(start)) { return false }

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

    // TODO: parse params and wrap the values in rule sets so that they can be
    // parsed as inline elements after
    console.log(params)

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
        if (marker_close.exec(state.src.slice(start + marker_len, max))) { break }
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

    token.children = inlineTokens

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
