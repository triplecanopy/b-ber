// Speaker lines (`:: Speaker :: text`) inside a dialogue, as
// b-ber-parser-dialogue marked them, kept exactly so that the output is
// unchanged (TASK-175).
//
// It runs each time a dialogue's tokens are complete, over every token parsed
// so far, and treats everything from a dialogue's open token to its close
// token as dialogue. A dialogue's close token sits at the end of its range,
// not at its `exit`, so a speaker line anywhere after a dialogue is marked
// too: TASK-161's intended output differences fix that.

import type MarkdownIt from 'markdown-it'

const SPEAKER_RE = /^(::\s?([^:]+?)\s?::)/

export function markSpeakers(
  tokens: MarkdownIt.Token[],
  isOpen: (token: MarkdownIt.Token) => boolean,
  isClose: (token: MarkdownIt.Token) => boolean
): void {
  let inDialogue = false
  tokens.forEach((t, i) => {
    if (isOpen(t)) inDialogue = true
    if (isClose(t)) inDialogue = false
    if (t.type !== 'inline' || !inDialogue) return

    const matched = t.content.match(SPEAKER_RE)
    if (!matched) return

    const parent = tokens[i - 1]
    if (parent.type === 'paragraph_open') {
      parent.attrPush(['class', 'interlocutor-parent'])
    }
    // The speaker's markup is used as a pattern, as it always was
    t.content = t.content.replace(new RegExp(matched[1]), '')
    // markdown-it gives every inline token a children array. The inline
    // parse appends the line's own tokens after these
    ;(t.children as Partial<MarkdownIt.Token>[]).push(
      {
        type: 'inline',
        attrs: [['class', 'interlocutor']],
        tag: 'span',
        nesting: 1,
        block: false,
      },
      { type: 'text', block: false, content: matched[2] },
      { type: 'inline', tag: 'span', nesting: -1 }
    )
  })
}
