// The single-line directives' string renders, adapted to the tree render
// (TASK-176) until each grammar builds elements itself. The token they are
// called with is shaped as b-ber-parser-figure made it, so the output is
// unchanged.

import type { DocumentEnv, InlineRender } from '@canopycanopycanopy/b-ber-lib'

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
