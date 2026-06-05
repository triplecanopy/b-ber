import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const BASE_URL = 'http://localhost:3000'

// Spine indices (linear items only — toc and notes are linear="no" and excluded)
// 0:  cover
// 1:  kitchen-sink-title-page
// 2:  kitchen-sink-copyright
// 3:  kitchen-sink-chapter-01
// 4:  kitchen-sink-chapter-02
// 5:  kitchen-sink-chapter-03
// 6:  kitchen-sink-spread-single
// 7:  kitchen-sink-spread-consecutive
// 8:  kitchen-sink-spread-edges
// 9:  kitchen-sink-colophon
// 10: figures-titlepage
//
// Slugs are derived by Url.slug(navLabel.text) from the NCX / OPF guide.
// They are NOT the XHTML filenames — cover has no NCX entry so its slug is ''.
export const SPINE = {
  cover: { slug: '', index: 0 },
  titlePage: { slug: 'kitchen-sink', index: 1 },
  chapter01: { slug: 'chapter-one', index: 3 },
  chapter02: { slug: 'chapter-two', index: 4 },
  chapter03: { slug: 'chapter-three', index: 5 },
  colophon: { slug: 'colophon', index: 9 },
  figuresTitlepage: { slug: 'figures', index: 10 },
}
export const LAST_SPINE_INDEX = 10

export function chapterURL(slug: string, index: number, spreadIndex = 0) {
  return `${BASE_URL}/?slug=${slug}&currentSpineItemIndex=${index}&spreadIndex=${spreadIndex}`
}

// Wait until the reader has fully loaded: footer visible and spinner gone.
// The spinner disappears when Ultimate.jsx declares the layout stable, which
// happens after the spine, chapter content, and viewerSettings are all set.
export async function waitForReader(page: Page, timeout = 30_000) {
  await expect(page.locator('footer.bber-controls__footer')).toBeVisible({
    timeout,
  })
  await expect(page.locator('.bber-spinner--visible')).toBeHidden({ timeout })
}

// Navigate to a chapter by URL params (more reliable than clicking through the spine).
export async function goToChapter(
  page: Page,
  slug: string,
  index: number,
  spreadIndex = 0
) {
  await page.goto(chapterURL(slug, index, spreadIndex))
  await waitForReader(page)
}

// Locator for the chapter-next button (last non-page-nav button in the footer).
export function chapterNextBtn(page: Page) {
  return page
    .locator(
      'footer.bber-controls__footer button.bber-nav__button:not(.bber-nav__button--page-next):not(.bber-nav__button--page-prev)'
    )
    .last()
}

// Locator for the chapter-prev button (first non-page-nav button in the footer).
export function chapterPrevBtn(page: Page) {
  return page
    .locator(
      'footer.bber-controls__footer button.bber-nav__button:not(.bber-nav__button--page-next):not(.bber-nav__button--page-prev)'
    )
    .first()
}

export { expect }
