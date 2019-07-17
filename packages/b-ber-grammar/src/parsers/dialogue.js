/* eslint-disable no-param-reassign,no-continue */

/*!
An adapted version of markdown-it-container 2.0.0
https://github.com//markdown-it/markdown-it-container
MIT license
*/

const containerPlugin = (md, name, options = {}) => {
    const minMarkers = options.minMarkers || 3
    const markerStr = options.marker || ':'
    const markerChar = markerStr.charCodeAt(0)
    const markerLen = markerStr.length
    const { validateOpen, render } = options
    // const validateClose = options.validateClose

    function container(state, startLine, endLine, silent) {
        const lineNr = startLine + 1

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

        if (!validateOpen(params, lineNr) /* && !validateClose(params, lineNr)*/) {
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
        let childOfDialogue = false
        state.tokens.forEach((t, i) => {
            if (t.type === 'container_dialogue_open') childOfDialogue = true
            if (t.type === 'container_dialogue_close') childOfDialogue = false

            if (t.type === 'inline' && childOfDialogue) {
                const matchedContent = t.content.match(/^(::\s?([^:]+?)\s?::)/)
                if (matchedContent) {
                    const parent = state.tokens[i - 1]
                    if (parent.type === 'paragraph_open') {
                        parent.attrPush(['class', 'interlocutor-parent'])
                    }
                    t.content = t.content.replace(new RegExp(matchedContent[1]), '')
                    t.children.push(
                        {
                            type: 'inline',
                            attrs: [['class', 'interlocutor']],
                            tag: 'span',
                            nesting: 1,
                            block: false,
                        },
                        {
                            type: 'text',
                            block: false,
                            content: matchedContent[2],
                        },
                        {
                            type: 'inline',
                            tag: 'span',
                            nesting: -1,
                        },
                    )
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
