import SpineItem from '../../src/models/SpineItem'

/**
 * Minimal SpineItem fixture. Pass field overrides to customize.
 */
export function makeSpineItem(overrides = {}) {
  return new SpineItem({
    id: 'chapter-1',
    href: 'text/chapter-1.xhtml',
    mediaType: 'application/xhtml+xml',
    properties: [],
    idref: 'chapter-1',
    linear: true,
    absoluteURL: 'http://localhost/OPS/text/chapter-1.xhtml',
    title: 'Chapter 1',
    slug: 'chapter-1',
    depth: 0,
    children: [],
    inTOC: true,
    ...overrides,
  })
}

/**
 * A two-chapter spine for navigation tests.
 */
export function makeTwoChapterSpine() {
  return [
    makeSpineItem({ id: 'chapter-1', title: 'Chapter 1', slug: 'chapter-1' }),
    makeSpineItem({
      id: 'chapter-2',
      title: 'Chapter 2',
      slug: 'chapter-2',
      href: 'text/chapter-2.xhtml',
      idref: 'chapter-2',
      absoluteURL: 'http://localhost/OPS/text/chapter-2.xhtml',
    }),
  ]
}

/**
 * Default uiOptions matching the initial reader-settings state.
 */
export const defaultUiOptions = {
  navigation: {
    /* eslint-disable camelcase */
    header_icons: { home: true, toc: true, downloads: true, info: true },
    footer_icons: { chapter: true, page: true },
    /* eslint-enable camelcase */
  },
}

/**
 * Default readerSettings for navigation tests (columns layout, not scrolling).
 */
export const defaultReaderSettings = {
  layout: 'columns',
}

/**
 * Default no-op navigation handlers.
 */
export const noopNavHandlers = {
  goToPrevChapter: () => {},
  goToNextChapter: () => {},
  goToPrevPage: () => {},
  goToNextPage: () => {},
}
