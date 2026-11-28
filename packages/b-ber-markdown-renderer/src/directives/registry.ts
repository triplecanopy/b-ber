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

// The old plugins whose lines the rule claims, each with the regex that
// plugin matched, kept exactly so that the rule claims the same lines it did.
// `params` is the line after the fence, trimmed: a name or `exit`, then
// optionally `:id` and the rest. They are tried in this order, which was the
// plugins' order in markdown-it's block rules.
//
// - `section`: b-ber-grammar-section's structural blocks, and an `exit` whose
//   id the host says is one of the cursor's (TASK-174);
// - `pullquote`: b-ber-grammar-pullquote's `pullquote` and `blockquote`, and
//   every other `exit`;
// - `dialogue`: b-ber-grammar-dialogue's `dialogue`;
// - `gallery` and `spread`: b-ber-grammar-gallery's and b-ber-grammar-spread's,
//   both parsed by b-ber-parser-gallery
export type Family = 'section' | 'pullquote' | 'dialogue' | 'gallery' | 'spread'

export const CLAIM_RE = new RegExp(
  `^(${Array.from(BLOCK_DIRECTIVES).join('|')}|exit)(?::([^\\s]+)(\\s.*)?)?$`
)

export const PULLQUOTE_CLAIM_RE =
  /^(pullquote|blockquote|exit)(?::([^\s]+)(\s.*)?)?$/

export const DIALOGUE_CLAIM_RE = /^(dialogue)(?::([^\s]+)(\s.*)?)?$/
export const GALLERY_CLAIM_RE = /^(gallery)(?::([^\s]+)(\s.*)?)?$/
export const SPREAD_CLAIM_RE = /^(spread)(?::([^\s]+)(\s.*)?)?$/

// The family each block the rule owns belongs to. The structure pass
// rewrites the tokens of these blocks
const FAMILY_OF = new Map<string, Family>([
  ...Array.from(BLOCK_DIRECTIVES, (name): [string, Family] => [
    name,
    'section',
  ]),
  ['pullquote', 'pullquote'],
  ['blockquote', 'pullquote'],
  ['dialogue', 'dialogue'],
  ['gallery', 'gallery'],
  ['spread', 'spread'],
])

export const OWNED: ReadonlySet<string> = new Set(FAMILY_OF.keys())

export const familyOf = (name: string): Family =>
  FAMILY_OF.get(name) ?? 'section'

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
