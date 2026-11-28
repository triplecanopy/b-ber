// The grammars' string renders, adapted to the tree render (TASK-176) until
// each grammar builds elements itself. A block's opener and its close are
// still two strings, written around its children; an inline directive's
// markup is one. The tokens they are called with are shaped as the old
// parsers made them, so the output is unchanged.

import type {
  BlockRender,
  ClosedBy,
  DocumentEnv,
  InlineRender,
} from '@canopycanopycanopy/b-ber-lib'

// A token as the string renders read it
export interface LegacyToken {
  type: string
  info: string
  nesting: number
  map: [number, number] | null
  // A single-line directive's caption source, as b-ber-parser-figure stored
  // it on its open token
  children?: string
}

// A markdown-it render rule's arguments, with the token shaped as the old
// parsers made it. Written as a method so that a grammar's render may declare
// the env it reads: TypeScript checks a method's parameters bivariantly
export type LegacyRender = {
  method(
    tokens: LegacyToken[],
    index: number,
    options: unknown,
    env: DocumentEnv
  ): string
}['method']

// A block being closed, as the close renders take it
export interface ClosingBlock {
  name: string
  id: string
  // The opener's line after the fence
  info: string
}

export type BlockClose = {
  method(block: ClosingBlock, closedBy: ClosedBy, env: DocumentEnv): string
}['method']

// The opener's markup, the children, then the close's. The close is drawn
// once the children have rendered, as it was when it had a token of its own
export const legacyBlock =
  (open: LegacyRender, close: BlockClose, options: unknown): BlockRender =>
  ({ node, env, h }) => {
    const { name, id, info, line } = node
    const opened = open(
      [{ type: 'directive_open', info, nesting: 1, map: [line, line + 1] }],
      0,
      options,
      env
    )
    return (children, closedBy) =>
      h.fragment([
        h.raw(opened),
        ...children,
        h.raw(close({ name, id, info }, closedBy, env)),
      ])
  }

export const legacyInline =
  (family: string, render: LegacyRender, options: unknown): InlineRender =>
  ({ node, env, h }) =>
    h.raw(
      render(
        [
          {
            type: `container_${family}_open`,
            info: node.info,
            nesting: 1,
            map: [node.line, node.line + 1],
            children: node.caption,
          },
        ],
        0,
        options,
        env
      )
    )
