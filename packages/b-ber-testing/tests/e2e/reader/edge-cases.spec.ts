import { test } from '@playwright/test'
import {
  chapterNextBtn,
  chapterPrevBtn,
  chapterURL,
  expect,
  goToChapter,
  LAST_SPINE_INDEX,
  SPINE,
  waitForReader,
} from './helpers'

test.describe('Reader edge cases', () => {
  test('first chapter hides the chapter-prev button', async ({ page }) => {
    await goToChapter(page, SPINE.cover.slug, SPINE.cover.index)

    // At index 0, the chapter-prev button must not be rendered
    const prevBtns = page.locator(
      'footer.bber-controls__footer button.bber-nav__button:not(.bber-nav__button--page-next):not(.bber-nav__button--page-prev)'
    )

    // Only chapter-next should exist (no chapter-prev at index 0)
    await expect(prevBtns).toHaveCount(1)
  })

  test('last chapter hides the chapter-next button', async ({ page }) => {
    await goToChapter(
      page,
      SPINE.figuresTitlepage.slug,
      SPINE.figuresTitlepage.index
    )

    // At the last index, the chapter-next button must not be rendered
    const chapterBtns = page.locator(
      'footer.bber-controls__footer button.bber-nav__button:not(.bber-nav__button--page-next):not(.bber-nav__button--page-prev)'
    )

    // Only chapter-prev should exist (no chapter-next at last index)
    await expect(chapterBtns).toHaveCount(1)
  })

  test('direct URL deep-link to chapter 02 loads correct content without passing through chapter 01', async ({
    page,
  }) => {
    // Navigate directly — not via chapter-next clicks
    await page.goto(chapterURL(SPINE.chapter02.slug, SPINE.chapter02.index))
    await waitForReader(page)

    const url = new URL(page.url())
    expect(url.searchParams.get('slug')).toBe(SPINE.chapter02.slug)
    expect(url.searchParams.get('currentSpineItemIndex')).toBe(
      String(SPINE.chapter02.index)
    )

    // Chapter 02 starts with a Dialogue section
    await expect(page.locator('section.dialogue')).toBeAttached()
    // Chapter 01 content must NOT be present
    await expect(
      page.locator('section#kitchen-sink-chapter-01')
    ).not.toBeAttached()
  })

  test('chapter-next is absent when navigating to the last chapter via next button', async ({
    page,
  }) => {
    // Start at the second-to-last item
    const _secondToLast = LAST_SPINE_INDEX - 1
    const { slug: colophonSlug, index: colophonIndex } = SPINE.colophon
    await goToChapter(page, colophonSlug, colophonIndex)

    // Click next to reach the last item
    await chapterNextBtn(page).click()
    await page.waitForURL(/currentSpineItemIndex=10/)

    // chapter-next should now be absent
    const chapterBtns = page.locator(
      'footer.bber-controls__footer button.bber-nav__button:not(.bber-nav__button--page-next):not(.bber-nav__button--page-prev)'
    )
    await expect(chapterBtns).toHaveCount(1)
  })
})
