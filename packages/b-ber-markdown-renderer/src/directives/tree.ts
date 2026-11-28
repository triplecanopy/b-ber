// Lifts markdown-it's flat token list into a tree. A directive pair becomes a
// `DirectiveNode`; other open/close pairs become a node of their token's type
// (`paragraph`, `list_item`, …), holding their close token; everything else is
// a leaf.
//
// A single-line directive becomes a `DirectiveNode` with `inline: true`.
//
// The tree holds every token once, in the order of the list, so rendering it
// in order (render.ts) writes what rendering the list would, apart from the
// directives' own markup, which their grammars build as elements.

import type MarkdownIt from 'markdown-it'
import type { Family } from './registry'
import { INLINE_TOKEN } from './rule'
import { CLOSE, type ClosedBy, OPEN } from './structure'
import {
  type DirectiveNode,
  isDirectiveNode,
  type MediaLine,
  type TokenNode,
  type TreeNode,
  type TreeRoot,
} from './types'

interface InlineMeta {
  family: Family | 'media'
  directive?: DirectiveNode
  mediaType?: string
  mediaId?: string
  captionSource?: string
}

// What a `media` token names
export const mediaLine = (meta: InlineMeta): MediaLine => ({
  type: meta.mediaType ?? '',
  id: meta.mediaId ?? '',
  ...(meta.captionSource === undefined
    ? {}
    : { captionSource: meta.captionSource }),
})

export function liftTree(tokens: MarkdownIt.Token[]): TreeRoot {
  const root: TreeRoot = { type: 'root', children: [] }
  const stack: { node: TreeNode | null; children: TreeNode[] }[] = [
    { node: null, children: root.children },
  ]
  const top = () => stack[stack.length - 1].children

  for (const token of tokens) {
    if (token.type === INLINE_TOKEN) {
      const meta = token.meta as unknown as InlineMeta
      const node = meta.directive
      if (node) {
        node.family = meta.family
        if (meta.family === 'media') node.media = mediaLine(meta)
      }
      top().push(node ?? { type: token.type, token })
      continue
    }
    if (token.nesting === 0) {
      top().push({ type: token.type, token })
      continue
    }
    if (token.nesting === -1) {
      // A close with nothing open is a leaf, so that it is still rendered
      if (stack.length === 1) {
        top().push({ type: token.type, token })
        continue
      }
      const { node } = stack.pop() as { node: TreeNode }
      if (!isDirectiveNode(node)) {
        node.close = token
      } else if (token.type === CLOSE) {
        node.closedBy = (token.meta as { closedBy: ClosedBy }).closedBy
      } else {
        // The structure pass closes every directive with its own token, so
        // this does not happen; the token is kept, after the directive
        node.closedBy = 'end'
        top().push({ type: token.type, token })
      }
      continue
    }
    if (token.type === OPEN) {
      const meta = token.meta as { directive: DirectiveNode; family?: Family }
      const node = meta.directive
      node.children = []
      if (meta.family) node.family = meta.family
      top().push(node)
      stack.push({ node, children: node.children })
      continue
    }
    const node: TokenNode = {
      type: token.type.replace(/_open$/, ''),
      token,
      children: [],
    }
    top().push(node)
    stack.push({ node, children: node.children as TreeNode[] })
  }
  return root
}
