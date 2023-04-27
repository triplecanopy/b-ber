const BLOCK_DIRECTIVE_MARKER = ':'
const INLINE_DIRECTIVE_MARKER = ':'
const BLOCK_DIRECTIVE_MARKER_MIN_LENGTH = 3
const INLINE_DIRECTIVE_MARKER_MIN_LENGTH = 3
const SECONDARY_INLINE_DIRECTIVE_MARKER_MIN_LENGTH = 2

const BLOCK_DIRECTIVE_FENCE = `${BLOCK_DIRECTIVE_MARKER.repeat(
  BLOCK_DIRECTIVE_MARKER_MIN_LENGTH
)} `

const INLINE_DIRECTIVE_FENCE = `${INLINE_DIRECTIVE_MARKER.repeat(
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH
)} `

const SECONDARY_INLINE_DIRECTIVE_FENCE_OPEN = `${INLINE_DIRECTIVE_MARKER.repeat(
  SECONDARY_INLINE_DIRECTIVE_MARKER_MIN_LENGTH
)} `

const SECONDARY_INLINE_DIRECTIVE_FENCE_CLOSE = `${INLINE_DIRECTIVE_MARKER.repeat(
  SECONDARY_INLINE_DIRECTIVE_MARKER_MIN_LENGTH
)}`

// block
const FRONTMATTER_DIRECTIVES = new Set([
  'frontmatter',
  'halftitlepage',
  'titlepage',
  'dedication',
  'epigraph',
  'foreword',
  'preface',
  'acknowledgments',
])

const BODYMATTER_DIRECTIVES = new Set([
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

const BACKMATTER_DIRECTIVES = new Set([
  'backmatter',
  'afterword',
  'loi',
  'appendix',
  'seriespage',
  'credits',
  'contributors',
  'colophon',
])

const INLINE_DIRECTIVES = new Set([
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

const MISC_DIRECTIVES = new Set([
  'pullquote',
  'blockquote',
  'dialogue',
  'gallery',
  'spread',
  'epigraph',
])

// belonging to the epub-vocab, but still in draft. see https://idpf.github.io/epub-vocabs/structure/
const DRAFT_DIRECTIVES = new Set([
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

const DEPRECATED_DIRECTIVES = new Set([
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

// unions
const BLOCK_DIRECTIVES = new Set([
  ...FRONTMATTER_DIRECTIVES,
  ...BODYMATTER_DIRECTIVES,
  ...BACKMATTER_DIRECTIVES,
])

const ALL_DIRECTIVES = new Set([
  ...BLOCK_DIRECTIVES,
  ...INLINE_DIRECTIVES,
  ...MISC_DIRECTIVES,
])

const HTML5AudiovideoAttributes = {
  autoplay: true,
  loop: true,
  controls: true,
  muted: true,
  preload: true,
  autobuffer: true,
  buffered: true,
  mozCurrentSampleOffset: true,
  played: true,
  volume: true,
  crossorigin: true,
}

const htmlIframeAttributes = {
  title: true,
  width: true,
  height: true,
  allow: true,
  // allowfullscreen: true,
  loading: true,
  name: true,
  referrerpolicy: true,
  sandbox: true,
  // src: true,
  srcdoc: true,
  scrolling: true,
  frameborder: true,
}

// Attributes that are used in the vimeo and vimeo-inline directives and passed
// to vimeo via query string
const vimeoEmbedAttributes = {
  autopause: true,
  autoplay: true,
  background: true,
  byline: true,
  color: true,
  controls: true,
  dnt: true,
  fun: true,
  loop: true,
  muted: true,
  playsinline: true,
  portrait: true,
  quality: true,
  speed: true,
  '#t': true,
  texttrack: true,
  title: true,
  transparent: true,
}

// b-ber attributes for audio, video and vimeo directives
const bBerAudiovideoAttributes = {
  classes: true,
  source: true,
  poster: true,
  aspectratio: true,
}

const SUPPORTED_ATTRIBUTES = {
  block: {
    title: true,
    classes: true,
  },

  // inline
  figure: {
    alt: true,
    caption: true,
    classes: true,
    source: true,
  },
  'figure-inline': {
    alt: true,
    caption: true,
    classes: true,
    source: true,
  },
  logo: {
    alt: true,
    source: true,
  },
  video: {
    ...HTML5AudiovideoAttributes,
    ...bBerAudiovideoAttributes,
  },
  'video-inline': {
    ...HTML5AudiovideoAttributes,
    ...bBerAudiovideoAttributes,
  },
  audio: {
    ...HTML5AudiovideoAttributes,
    ...bBerAudiovideoAttributes,
  },
  'audio-inline': {
    ...HTML5AudiovideoAttributes,
    ...bBerAudiovideoAttributes,
  },
  vimeo: {
    ...vimeoEmbedAttributes,
    ...bBerAudiovideoAttributes,
  },
  'vimeo-inline': {
    ...vimeoEmbedAttributes,
    ...bBerAudiovideoAttributes,
  },

  iframe: {
    ...htmlIframeAttributes,
    source: true,
    classes: true,
    poster: true,
  },
  'iframe-inline': {
    ...htmlIframeAttributes,
    source: true,
    classes: true,
    poster: true,
  },

  // misc
  pullquote: {
    classes: true,
    citation: true,
  },
  blockquote: {
    classes: true,
    citation: true,
  },
  dialogue: {
    classes: true,
  },
  gallery: {
    caption: true,
    sources: true,
  },
  spread: {
    classes: true,
  },
  epigraph: {
    alt: true,
    source: true,
  },
}

const DIRECTIVES_REQUIRING_ALT_TAG = new Set([
  'figure',
  'figure-inline',
  'logo',
])

export {
  htmlIframeAttributes,
  BLOCK_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER,
  BLOCK_DIRECTIVE_FENCE,
  INLINE_DIRECTIVE_FENCE,
  SECONDARY_INLINE_DIRECTIVE_FENCE_OPEN,
  SECONDARY_INLINE_DIRECTIVE_FENCE_CLOSE,
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
