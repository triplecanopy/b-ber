export const BLOCK_DIRECTIVE_MARKER = ':'
export const INLINE_DIRECTIVE_MARKER = ':'
export const BLOCK_DIRECTIVE_MARKER_MIN_LENGTH = 3
export const INLINE_DIRECTIVE_MARKER_MIN_LENGTH = 3
export const SECONDARY_INLINE_DIRECTIVE_MARKER_MIN_LENGTH = 2

export const BLOCK_DIRECTIVE_FENCE = `${BLOCK_DIRECTIVE_MARKER.repeat(
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH
)} `

export const INLINE_DIRECTIVE_FENCE = `${INLINE_DIRECTIVE_MARKER.repeat(
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH
)} `

export const SECONDARY_INLINE_DIRECTIVE_FENCE_OPEN = `${INLINE_DIRECTIVE_MARKER.repeat(
  SECONDARY_INLINE_DIRECTIVE_MARKER_MIN_LENGTH
)} `

export const SECONDARY_INLINE_DIRECTIVE_FENCE_CLOSE = `${INLINE_DIRECTIVE_MARKER.repeat(
  SECONDARY_INLINE_DIRECTIVE_MARKER_MIN_LENGTH
)}`

export const FRONTMATTER_DIRECTIVES = new Set([
  'frontmatter',
  'halftitlepage',
  'titlepage',
  'dedication',
  'epigraph',
  'foreword',
  'preface',
  'acknowledgments',
])

export const BODYMATTER_DIRECTIVES = new Set([
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
])

export const BACKMATTER_DIRECTIVES = new Set([
  'backmatter',
  'afterword',
  'loi',
  'appendix',
  'seriespage',
  'credits',
  'contributors',
  'colophon',
])

export const INLINE_DIRECTIVES = new Set([
  'figure',
  'figure-inline',
  'logo',
  'video',
  'video-inline',
  'audio',
  'audio-inline',
  'vimeo',
  'vimeo-inline',
  'iframe',
  'iframe-inline',
  'media',
  'media-inline',
])

export const MISC_DIRECTIVES = new Set([
  'pullquote',
  'blockquote',
  'dialogue',
  'gallery',
  'spread',
  'epigraph',
])

// belonging to the epub-vocab, but still in draft. see https://idpf.github.io/epub-vocabs/structure/
export const DRAFT_DIRECTIVES = new Set([
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
])

export const DEPRECATED_DIRECTIVES = new Set([
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
])


export const BLOCK_DIRECTIVES = new Set([
  ...FRONTMATTER_DIRECTIVES,
  ...BODYMATTER_DIRECTIVES,
  ...BACKMATTER_DIRECTIVES,
])

export const ALL_DIRECTIVES = new Set([
  ...BLOCK_DIRECTIVES,
  ...INLINE_DIRECTIVES,
  ...MISC_DIRECTIVES,
])

export const htmlAudioVideoAttributes = new Set([
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
])

export const htmlIframeAttributes = new Set([
  'title',
  'width',
  'height',
  'allow',
  'loading',
  'name',
  'referrerpolicy',
  'sandbox',
  'srcdoc',
  'scrolling',
  'frameborder',
])

// Attributes that are used in the vimeo and vimeo-inline directives and passed
// to vimeo via query string
export const vimeoEmbedAttributes = new Set([
  'autopause',
  'autoplay',
  'background',
  'byline',
  'color',
  'controls',
  'dnt',
  'fun',
  'loop',
  'muted',
  'playsinline',
  'portrait',
  'quality',
  'speed',
  '#t',
  'texttrack',
  'title',
  'transparent',
])

// b-ber attributes for audio, video and vimeo directives
export const bBerAudioVideoAttributes = new Set([
  'classes',
  'source',
  'poster',
  'aspectratio',
])

export const SUPPORTED_ATTRIBUTES = {
  block: new Set([
    'title',
    'classes',
  ]),

  figure: new Set([
    'alt',
    'caption',
    'classes',
    'source'
  ]),

  'figure-inline': new Set([
    'alt',
    'caption',
    'classes',
    'source'
  ]),

  logo: new Set([
    'alt',
    'source'
  ]),

  video: new Set([
    ...htmlAudioVideoAttributes,
    ...bBerAudioVideoAttributes
  ]),

  'video-inline': new Set([
    ...htmlAudioVideoAttributes,
    ...bBerAudioVideoAttributes
  ]),

  audio: new Set([
    ...htmlAudioVideoAttributes,
    ...bBerAudioVideoAttributes
  ]),

  'audio-inline': new Set([
    ...htmlAudioVideoAttributes,
    ...bBerAudioVideoAttributes
  ]),

  vimeo: new Set([
    ...vimeoEmbedAttributes,
    ...bBerAudioVideoAttributes,
  ]),

  'vimeo-inline': new Set([
    ...vimeoEmbedAttributes,
    ...bBerAudioVideoAttributes,
  ]),


  iframe: new Set([
    ...htmlIframeAttributes,
    'source',
    'classes',
    'poster',
  ]),

  'iframe-inline': new Set([
    ...htmlIframeAttributes,
    'source',
    'classes',
    'poster',
  ]),

  pullquote: new Set([
    'classes',
    'citation',
  ]),

  blockquote: new Set([
    'classes',
    'citation',
  ]),

  dialogue: new Set([
    'classes',
  ]),

  gallery: new Set([
    'caption',
    'sources',
  ]),

  spread: new Set([
    'classes',
  ]),

  epigraph: new Set([
    'alt',
    'source',
  ]),
}

export const DIRECTIVES_REQUIRING_ALT_TAG = new Set([
  'figure',
  'figure-inline',
  'logo',
])
