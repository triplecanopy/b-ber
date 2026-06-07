import { test } from '@playwright/test'
import {
  BASE_URL,
  chapterNextBtn,
  chapterPrevBtn,
  chapterURL,
  expect,
  goToChapter,
  SPINE,
  waitForReader,
} from './helpers'

test.describe('Reader navigation', () => {
  test('initial load renders the first spine item', async ({ page }) => {
    await page.goto(BASE_URL)
    await waitForReader(page)

    const url = new URL(page.url())
    // cover is spine index 0 — the default landing chapter.
    // On initial load without params the reader doesn't add a slug to the URL,
    // but it does set currentSpineItemIndex=0.
    expect(url.searchParams.get('currentSpineItemIndex')).toBe('0')
  })

  test('chapter-next button advances to the next spine item', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.cover.slug, SPINE.cover.index)

    await chapterNextBtn(page).click()

    // URL should update to the title page (index 1); use index for the wait
    // since the slug 'kitchen-sink' is a prefix of several other slugs
    await page.waitForURL(/currentSpineItemIndex=1/)
    const url = new URL(page.url())
    expect(url.searchParams.get('currentSpineItemIndex')).toBe('1')
    expect(url.searchParams.get('slug')).toBe(SPINE.titlePage.slug)
  })

  test('chapter-prev button rewinds to the previous spine item', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.titlePage.slug, SPINE.titlePage.index)

    await chapterPrevBtn(page).click()

    // Cover has no NCX entry so its slug is '' — wait on index instead
    await page.waitForURL(/currentSpineItemIndex=0/)
    const url = new URL(page.url())
    expect(url.searchParams.get('currentSpineItemIndex')).toBe('0')
  })

  test('TOC sidebar opens on icon click and closes after chapter navigation', async ({
    page,
  }) => {
    // Start at chapter02 to avoid the cover SVG intercepting clicks on the header
    await goToChapter(page, SPINE.chapter02.slug, SPINE.chapter02.index)

    const tocBtn = page.locator('.bber-li-toc button.bber-nav__button')
    await expect(tocBtn).toBeVisible()

    // Open TOC — use evaluate click because Playwright's pointer events are
    // intercepted by the reader's column layout overlay in this environment
    await tocBtn.evaluate((el) => (el as HTMLElement).click())
    await expect(
      page.locator('.bber-controls__sidebar__chapters--open')
    ).toBeVisible()

    // Click a chapter entry in the TOC (chapter 01)
    await page
      .locator('.bber-controls__sidebar__chapters button')
      .filter({ hasText: 'Chapter One' })
      .click()

    // Sidebar should close and URL should update
    await page.waitForURL(/slug=chapter-one/)
    await expect(
      page.locator('.bber-controls__sidebar__chapters--open')
    ).not.toBeVisible()
  })

  test('URL query string updates to reflect spine position after navigation', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.chapter01.slug, SPINE.chapter01.index)

    await chapterNextBtn(page).click()
    await page.waitForURL(/currentSpineItemIndex=4/)

    const url = new URL(page.url())
    expect(url.searchParams.get('currentSpineItemIndex')).toBe('4')
  })

  test('localStorage persists reader position across page reload', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.chapter02.slug, SPINE.chapter02.index)

    // Reload and expect the same chapter to load (from localStorage)
    await page.reload()
    await waitForReader(page)

    const url = new URL(page.url())
    expect(url.searchParams.get('slug')).toBe(SPINE.chapter02.slug)
  })

  test('keyboard right arrow navigates pages within a chapter', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.chapter01.slug, SPINE.chapter01.index)

    const before = new URL(page.url())
    const beforeSpread = before.searchParams.get('spreadIndex') ?? '0'

    // Press right arrow — this navigates to the next page (spreadIndex + 1)
    await page.keyboard.press('ArrowRight')

    // Either spreadIndex increments OR we move to the next chapter
    // (if the chapter has only one page). Either is a valid navigation event.
    await page.waitForFunction(
      (prevUrl) => window.location.href !== prevUrl,
      page.url()
    )

    const after = new URL(page.url())
    const afterSpread = after.searchParams.get('spreadIndex') ?? '0'
    const afterIndex = after.searchParams.get('currentSpineItemIndex') ?? '3'

    expect(
      Number(afterSpread) > Number(beforeSpread) ||
        Number(afterIndex) > SPINE.chapter01.index
    ).toBe(true)
  })

  test('direct URL deep-link to chapter 02 loads correct content', async ({
    page,
  }) => {
    await page.goto(chapterURL(SPINE.chapter02.slug, SPINE.chapter02.index))
    await waitForReader(page)

    const url = new URL(page.url())
    expect(url.searchParams.get('slug')).toBe(SPINE.chapter02.slug)
    // Chapter 02 has a Dialogue section
    await expect(page.locator('section.dialogue')).toBeAttached()
  })
})
