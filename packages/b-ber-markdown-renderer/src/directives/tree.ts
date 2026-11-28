// Lifts markdown-it's flat token list into a tree. A directive pair becomes a
// `DirectiveNode`; other open/close pairs become a node of their token's type
// (`paragraph`, `list_item`, …); everything else is a leaf.
//
// A single-line directive becomes a `DirectiveNode` with `inline: true`.

import type MarkdownIt from 'markdown-it'
import { INLINE_TOKEN } from './rule'
import { OPEN } from './structure'
import type { DirectiveNode, TokenNode, TreeNode, TreeRoot } from './types'

export function liftTree(tokens: MarkdownIt.Token[]): TreeRoot {
  const root: TreeRoot = { type: 'root', children: [] }
  const stack: TreeNode[][] = [root.children]
  const top = () => stack[stack.length - 1]

  for (const token of tokens) {
    if (token.type === INLINE_TOKEN) {
      const node = (token.meta as { directive?: DirectiveNode }).directive
      top().push(node ?? { type: token.type, token })
      continue
    }
    if (token.nesting === 0) {
      top().push({ type: token.type, token })
      continue
    }
    if (token.nesting === -1) {
      if (stack.length > 1) stack.pop()
      continue
    }
    if (token.type === OPEN) {
      const node = (token.meta as { directive: DirectiveNode }).directive
      node.children = []
      top().push(node)
      stack.push(node.children)
      continue
    }
    const node: TokenNode = {
      type: token.type.replace(/_open$/, ''),
      token,
      children: [],
    }
    top().push(node)
    stack.push(node.children as TreeNode[])
  }
  return root
}
