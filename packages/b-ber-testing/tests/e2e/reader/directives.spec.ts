import { test } from '@playwright/test'
import { expect, goToChapter, SPINE } from './helpers'

test.describe('Reader directive rendering', () => {
  test('section: chapter section element is rendered with h1', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.chapter01.slug, SPINE.chapter01.index)
    await expect(page.locator('section.chapter h1')).toBeAttached()
    await expect(page.locator('section.chapter h1')).toContainText(
      'Chapter One'
    )
  })

  test('footnotes: footnote-ref link is present in chapter 01', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.chapter01.slug, SPINE.chapter01.index)
    // process-nodes.js wraps the noteref <a> in <span class="footnote-ref">
    await expect(page.locator('.footnote-ref')).toBeAttached()
  })

  test('figure: figure with img is present in chapter 01', async ({ page }) => {
    await goToChapter(page, SPINE.chapter01.slug, SPINE.chapter01.index)
    await expect(page.locator('figure img')).toBeAttached()
  })

  test('pullquote: pullquote section is present in chapter 01', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.chapter01.slug, SPINE.chapter01.index)
    await expect(page.locator('section.pullquote')).toBeAttached()
  })

  test('dialogue: dialogue section is present in chapter 02', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.chapter02.slug, SPINE.chapter02.index)
    await expect(page.locator('section.dialogue')).toBeAttached()
  })

  test('gallery: gallery section with figure items is present in chapter 02', async ({
    page,
  }) => {
    await goToChapter(page, SPINE.chapter02.slug, SPINE.chapter02.index)
    await expect(page.locator('section.gallery')).toBeAttached()
    // 1 outer figure wrapping 1 inner figure (ch-02-gallery-figure-01)
    await expect(page.locator('section.gallery figure')).toHaveCount(2)
  })

  test('spread: spread div is present in chapter 02', async ({ page }) => {
    await goToChapter(page, SPINE.chapter02.slug, SPINE.chapter02.index)
    await expect(page.locator('div.spread')).toBeAttached()
    // SpreadFigure renders spread__content as a <figure>, not a <div>
    await expect(page.locator('.spread__content')).toBeAttached()
  })

  test('iframe: iframe element is present in the figures page', async ({
    page,
  }) => {
    await goToChapter(
      page,
      SPINE.figuresTitlepage.slug,
      SPINE.figuresTitlepage.index
    )
    await expect(page.locator('iframe')).toBeAttached()
  })

  test('audio: audio element is present in the figures page', async ({
    page,
  }) => {
    await goToChapter(
      page,
      SPINE.figuresTitlepage.slug,
      SPINE.figuresTitlepage.index
    )
    await expect(page.locator('audio')).toBeAttached()
  })

  test('video: video element is present in the figures page', async ({
    page,
  }) => {
    await goToChapter(
      page,
      SPINE.figuresTitlepage.slug,
      SPINE.figuresTitlepage.index
    )
    await expect(page.locator('video')).toBeAttached()
  })

  test('vimeo: vimeo embed is present in the figures page', async ({
    page,
  }) => {
    test.skip(
      !!process.env.NO_NETWORK,
      'Skipped when NO_NETWORK is set — Vimeo requires network access'
    )
    await goToChapter(
      page,
      SPINE.figuresTitlepage.slug,
      SPINE.figuresTitlepage.index
    )
    // process-nodes.js removes data-vimeo from the rendered iframe;
    // match the outer container div instead
    await expect(page.locator('div.vimeo')).toBeAttached()
  })

  test('logo: logo figure is present in the colophon', async ({ page }) => {
    await goToChapter(page, SPINE.colophon.slug, SPINE.colophon.index)
    await expect(page.locator('figure.logo')).toBeAttached()
  })

  test('frontmatter: title page renders the book title', async ({ page }) => {
    await goToChapter(page, SPINE.titlePage.slug, SPINE.titlePage.index)
    await expect(page.locator('h1')).toContainText('Kitchen Sink')
  })
})
