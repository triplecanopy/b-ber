// The shapes of the figures that b-ber-grammar-* directives add to
// `state.figures`, which b-ber-tasks' `loi` task (and b-ber-grammar-image, for
// inline figures) hand to the templates in this directory. Each variant
// describes what its template needs, which is the contract a directive has to
// meet, not everything a directive happens to add.

// Fields common to every figure, whichever directive produced it
interface FigureBase {
  // An HTML id, from b-ber-grammar-attributes' `htmlId`
  id: string
  // Path of the image, media file, iframe URL or Vimeo ID
  source: string
  caption: string
  // Inline figures are rendered in place, rather than on a page in the LOI
  inline?: boolean
  // Space-separated class names
  classes?: string
  applyInlineClasses?: boolean
  // Image figures set `mime-types`' lookup, which is `false` for an unknown
  // extension; audio and video set their media type; iframe and Vimeo set null
  mime?: string | false | null
  // The directive name, e.g. `iframe` or `vimeo`, for embedded figures
  type?: string
  width?: number | string
  height?: number | string
}

export interface ImageFigureData extends FigureBase {
  alt: string
  // Pixel dimensions, read from the image file
  width: number
  height: number
  // The chapter that references the figure. Absent for inline figures, which
  // do not link back to it
  ref?: string
}

export interface MediaFigureData extends FigureBase {
  // The chapter that references the figure
  ref: string
  // `audio` or `video`, used as the element name
  mediaType: string
  attrString: string
  sourceElements: string
  poster: string
}

export interface IframeFigureData extends FigureBase {
  ref: string
  title: string
  // Either may be a number: b-ber-grammar-iframe defaults `height` to 150
  width: number | string
  height: number | string
  poster: string
}

export interface VimeoFigureData extends FigureBase {
  ref: string
  aspectRatio: string
  aspectRatioClassName: string
  // Query string of Vimeo player options, including the leading `?`
  attrQuery: string
  poster: string
}

export type FigureData =
  | ImageFigureData
  | MediaFigureData
  | IframeFigureData
  | VimeoFigureData

// An embed that the build cannot play, which is rendered as its poster image
export type UnsupportedFigureData = IframeFigureData | VimeoFigureData

// The complete data `figureTemplate` renders, once the class names and link
// behaviour have been resolved for the figure's orientation and build
export interface FigureTemplateData {
  id: string
  source: string
  alt: string
  caption: string
  ref?: string
  inline?: boolean
  classes: string
  // null when b-ber-lib's `getImageOrientation` cannot classify an
  // unsupported embed's poster image, which only a 0×0 image produces
  imageClassName: string | null
  linkImages: boolean
  applyInlineClasses?: boolean
}

// Image orientations, as returned by b-ber-lib's `getImageOrientation`
export type RatioName = 'portrait' | 'landscape' | 'portrait-high' | 'square'

// One build's templates, keyed by the format `figures/index` derives from the
// figure's orientation or media type
export interface FigureTemplates {
  portrait: (data: ImageFigureData) => string
  landscape: (data: ImageFigureData) => string
  'portrait-high': (data: ImageFigureData) => string
  square: (data: ImageFigureData) => string
  audio: (data: MediaFigureData) => string
  video: (data: MediaFigureData) => string
  iframe: (data: IframeFigureData) => string
  vimeo: (data: VimeoFigureData) => string
}
