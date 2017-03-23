
const BLOCK_DIRECTIVE_MARKER = ':'
const INLINE_DIRECTIVE_MARKER = ':'
const BLOCK_DIRECTIVE_FENCE = '::: '
const INLINE_DIRECTIVE_FENCE = '::: '
const BLOCK_DIRECTIVE_MARKER_MIN_LENGTH = 3
const INLINE_DIRECTIVE_MARKER_MIN_LENGTH = 3
const FRONTMATTER_DIRECTIVES = [
  'halftitlepage',
  'titlepage',
  'dedication',
  'epigraph',
  'foreword',
  'preface',
  'acknowledgments'
]
const BODYMATTER_DIRECTIVES = [
  'introduction',
  'prologue',
  'chapter',
  'subchapter',
  'epilogue',
  'afterword',
  'conclusion'
]
const BACKMATTER_DIRECTIVES = [
  'loi',
  'appendix',
  'seriespage',
  'credits',
  'contributors',
  'colophon'
]
const MISC_DIRECTIVES = [
  'pullquote',
  'dialogue'
]

export { BLOCK_DIRECTIVE_MARKER, INLINE_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_FENCE, INLINE_DIRECTIVE_FENCE,
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH, INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
  FRONTMATTER_DIRECTIVES, BODYMATTER_DIRECTIVES, BACKMATTER_DIRECTIVES,
  MISC_DIRECTIVES }
