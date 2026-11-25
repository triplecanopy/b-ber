// The directive names the rule recognizes, by kind, from TASK-161's "Names and
// kinds". Only `ALL_DIRECTIVES` and `exit` are names: the draft-only and
// deprecated-only names are unknown (decision 3).

import {
  ALL_DIRECTIVES,
  BLOCK_DIRECTIVES,
  INLINE_DIRECTIVES,
  SUPPORTED_ATTRIBUTES,
} from '@canopycanopycanopy/b-ber-shapes-directives'

export const EXIT = 'exit'

// The blocks `b-ber-grammar-section` renders today: the frontmatter,
// bodymatter and backmatter sets, `epigraph` among them. This rule owns them.
export const STRUCTURAL: ReadonlySet<string> = BLOCK_DIRECTIVES

// Blocks still parsed by their own plugins until TASK-175. The rule tracks
// their nesting so that an `exit` is matched against every open block.
export const MISC_BLOCKS: ReadonlySet<string> = new Set([
  'pullquote',
  'blockquote',
  'dialogue',
  'gallery',
  'spread',
])

export const INLINE: ReadonlySet<string> = INLINE_DIRECTIVES

// Rendered as `chapter` with a warning, as `b-ber-grammar-attributes` does
export const DEPRECATED_NAMES: ReadonlySet<string> = new Set(['subchapter'])
export const DRAFT_NAMES: ReadonlySet<string> = new Set([
  'credits',
  'seriespage',
])

// The attributes every structural block accepts
export const BLOCK_ATTRIBUTES: ReadonlySet<string> = SUPPORTED_ATTRIBUTES.block

export const isKnownName = (name: string): boolean =>
  name === EXIT || ALL_DIRECTIVES.has(name)

export const isBlockName = (name: string): boolean =>
  STRUCTURAL.has(name) || MISC_BLOCKS.has(name)

// What `b-ber-grammar-section` matched, kept exactly so that the rule claims
// the same lines the old parser did. `params` is the line after the fence,
// trimmed. A structural name or `exit`, then optionally `:id` and the rest.
export const CLAIM_RE = new RegExp(
  `^(${Array.from(BLOCK_DIRECTIVES).join('|')}|exit)(?::([^\\s]+)(\\s.*)?)?$`
)

const distance = (a: string, b: string): number => {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = row[j]
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
      diagonal = above
    }
  }
  return row[b.length]
}

// The closest registered name, for "Did you mean". Two edits catches a typo
// or a transposition without suggesting a different word
const MAX_SUGGESTION_DISTANCE = 2

export const suggestName = (name: string): string | null => {
  let best: string | null = null
  let bestDistance = MAX_SUGGESTION_DISTANCE + 1
  for (const candidate of [...ALL_DIRECTIVES, EXIT]) {
    const d = distance(name.toLowerCase(), candidate)
    if (d < bestDistance) {
      best = candidate
      bestDistance = d
    }
  }
  return best
}
