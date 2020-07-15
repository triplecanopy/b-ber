import {
  BLOCK_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_FENCE,
  INLINE_DIRECTIVE_FENCE,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
  FRONTMATTER_DIRECTIVES,
  BODYMATTER_DIRECTIVES,
  BACKMATTER_DIRECTIVES,
  BLOCK_DIRECTIVES,
  INLINE_DIRECTIVES,
  MISC_DIRECTIVES,
  ALL_DIRECTIVES,
  // SUPPORTED_ATTRIBUTES,
  // DIRECTIVES_REQUIRING_ALT_TAG,
  DRAFT_DIRECTIVES,
  DEPRECATED_DIRECTIVES,
} from '../src'

describe('directives', () => {
  it('uses the correct markers', () => {
    expect(BLOCK_DIRECTIVE_MARKER).toBe(':')
    expect(INLINE_DIRECTIVE_MARKER).toBe(':')
    expect(BLOCK_DIRECTIVE_FENCE).toBe('::: ')
    expect(INLINE_DIRECTIVE_FENCE).toBe('::: ')
    expect(BLOCK_DIRECTIVE_MARKER_MIN_LENGTH).toBe(3)
    expect(INLINE_DIRECTIVE_MARKER_MIN_LENGTH).toBe(3)
  })

  it('exports lists of directives', () => {
    expect(FRONTMATTER_DIRECTIVES).toBeInstanceOf(Set)
    expect(BODYMATTER_DIRECTIVES).toBeInstanceOf(Set)
    expect(BACKMATTER_DIRECTIVES).toBeInstanceOf(Set)
    expect(INLINE_DIRECTIVES).toBeInstanceOf(Set)
    expect(MISC_DIRECTIVES).toBeInstanceOf(Set)
    expect(DRAFT_DIRECTIVES).toBeInstanceOf(Set)
    expect(DEPRECATED_DIRECTIVES).toBeInstanceOf(Set)
  })

  it('exports merged directive lists', () => {
    expect(BLOCK_DIRECTIVES).toEqual(
      new Set([
        ...FRONTMATTER_DIRECTIVES,
        ...BODYMATTER_DIRECTIVES,
        ...BACKMATTER_DIRECTIVES,
      ])
    )

    expect(ALL_DIRECTIVES).toEqual(
      new Set([...BLOCK_DIRECTIVES, ...INLINE_DIRECTIVES, ...MISC_DIRECTIVES])
    )
  })
})
