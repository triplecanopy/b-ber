const BLOCK_DIRECTIVE_MARKER = ':'
const INLINE_DIRECTIVE_MARKER = ':'
const BLOCK_DIRECTIVE_MARKER_MIN_LENGTH = 3
const INLINE_DIRECTIVE_MARKER_MIN_LENGTH = 3

const BLOCK_DIRECTIVE_FENCE = `${BLOCK_DIRECTIVE_MARKER.repeat(BLOCK_DIRECTIVE_MARKER_MIN_LENGTH)} `
const INLINE_DIRECTIVE_FENCE = `${INLINE_DIRECTIVE_MARKER.repeat(INLINE_DIRECTIVE_MARKER_MIN_LENGTH)} `

// block
const FRONTMATTER_DIRECTIVES = [
    'frontmatter',
    'halftitlepage',
    'titlepage',
    'dedication',
    'epigraph',
    'foreword',
    'preface',
    'acknowledgments',
]
const BODYMATTER_DIRECTIVES = [
    'bodymatter',
    'introduction',
    'prologue',
    'chapter',
    'subchapter',
    'epilogue',
    'conclusion',
    'part',
    'volume',

    // Generic container directives for secitoning layout
    'section',
    'article',
]
const BACKMATTER_DIRECTIVES = [
    'backmatter',
    'afterword',
    'loi',
    'appendix',
    'seriespage',
    'credits',
    'contributors',
    'colophon',
]

// inline
const INLINE_DIRECTIVES = ['figure', 'figure-inline', 'logo', 'video', 'audio', 'video-inline', 'audio-inline']

// misc
const MISC_DIRECTIVES = ['pullquote', 'blockquote', 'dialogue', 'gallery', 'spread', 'epigraph']

// belonging to the epub-vocab, but still in draft. see https://idpf.github.io/epub-vocabs/structure/
const DRAFT_DIRECTIVES = [
    'abstract',
    'toc-brief',
    'credits',
    'keywords',
    'seriespage',
    'case-study',
    'pullquote',
    'label',
    'ordinal',
    'learning-objectives',
    'learning-outcome',
    'learning-outcomes',
    'learning-resources',
    'learning-standard',
    'learning-standards',
    'answer',
    'answers',
    'assessments',
    'feedback',
    'fill-in-the-blank-problem',
    'general-problem',
    'match-problem',
    'multiple-choice-problem',
    'practice',
    'question',
    'practices',
    'true-false-problem',
    'biblioref',
    'glossref',
    'backlink',
    'credit',
]

const DEPRECATED_DIRECTIVES = [
    'subchapter',
    'help',
    'marginalia',
    'sidebar',
    'warning',
    'annotation',
    'note',
    'rearnote',
    'rearnotes',
    'annoref',
]

// unions
const BLOCK_DIRECTIVES = [...FRONTMATTER_DIRECTIVES, ...BODYMATTER_DIRECTIVES, ...BACKMATTER_DIRECTIVES]
const ALL_DIRECTIVES = [...BLOCK_DIRECTIVES, ...INLINE_DIRECTIVES, ...MISC_DIRECTIVES]

const SUPPORTED_ATTRIBUTES = [
    'title',
    'classes',
    'pagebreak',
    'attributes',
    'alt',
    'citation',
    'source',
    'sources',
    'poster',
    'autoplay',
    'loop',
    'controls',
    'muted',
    'preload',
    'autobuffer',
    'buffered',
    'mozCurrentSampleOffset',
    'played',
    'volume',
    'crossorigin',
    'height',
    'width',
    // 'attrs',
]

const DIRECTIVES_REQUIRING_ALT_TAG = ['figure', 'figure-inline', 'logo']

export {
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
    SUPPORTED_ATTRIBUTES,
    DIRECTIVES_REQUIRING_ALT_TAG,
    DRAFT_DIRECTIVES,
    DEPRECATED_DIRECTIVES,
}
