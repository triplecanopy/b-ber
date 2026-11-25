// Lifts markdown-it's flat token list into a tree. A directive pair becomes a
// `DirectiveNode`; other open/close pairs become a node of their token's type
// (`paragraph`, `list_item`, …); everything else is a leaf.
//
// The containers of the directives not yet ported (`container_*`, TASK-175)
// run to the end of their range, so their pairs do not nest with the rest.
// Until they are ported their tokens are leaves.

import type MarkdownIt from 'markdown-it'
import { OPEN } from './structure'
import type { DirectiveNode, TokenNode, TreeNode, TreeRoot } from './types'

const isLegacy = (token: MarkdownIt.Token): boolean =>
  token.type.startsWith('container_')

export function liftTree(tokens: MarkdownIt.Token[]): TreeRoot {
  const root: TreeRoot = { type: 'root', children: [] }
  const stack: TreeNode[][] = [root.children]
  const top = () => stack[stack.length - 1]

  for (const token of tokens) {
    if (isLegacy(token) || token.nesting === 0) {
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
