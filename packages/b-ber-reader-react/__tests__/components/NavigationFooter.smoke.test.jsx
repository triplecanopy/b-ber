/**
 * Smoke tests for NavigationFooter.
 *
 * Critical regression coverage:
 *   - TASK-002: spine=undefined caused a crash (props.spine.length threw)
 *   - TASK-008: navigation buttons must show/hide correctly at chapter boundaries
 */

import { render } from '@testing-library/react'
import React from 'react'
import NavigationFooter from '../../src/components/Navigation/NavigationFooter'
import {
  defaultReaderSettings,
  defaultUiOptions,
  makeTwoChapterSpine,
} from '../helpers/fixtures'

function renderFooter({
  spine = makeTwoChapterSpine(),
  currentSpineItemIndex = 0,
  spreadIndex = 0,
  lastSpreadIndex = 0,
  uiOptions = defaultUiOptions,
  readerSettings = defaultReaderSettings,
  goToPrevChapter = () => {},
  goToNextChapter = () => {},
  goToPrevPage = () => {},
  goToNextPage = () => {},
} = {}) {
  return render(
    <NavigationFooter
      spine={spine}
      currentSpineItemIndex={currentSpineItemIndex}
      spreadIndex={spreadIndex}
      lastSpreadIndex={lastSpreadIndex}
      uiOptions={uiOptions}
      readerSettings={readerSettings}
      goToPrevChapter={goToPrevChapter}
      goToNextChapter={goToNextChapter}
      goToPrevPage={goToPrevPage}
      goToNextPage={goToNextPage}
    />
  )
}

describe('NavigationFooter', () => {
  test('renders null when spine is undefined (regression: TASK-002 crash)', () => {
    const { container } = render(
      <NavigationFooter
        spine={undefined}
        currentSpineItemIndex={0}
        spreadIndex={0}
        lastSpreadIndex={0}
        uiOptions={defaultUiOptions}
        readerSettings={defaultReaderSettings}
        goToPrevChapter={() => {}}
        goToNextChapter={() => {}}
        goToPrevPage={() => {}}
        goToNextPage={() => {}}
      />
    )

    // Component should return null — no DOM nodes
    expect(container.firstChild).toBeNull()
  })

  test('renders footer (not null) when spine is an empty array', () => {
    const { container } = renderFooter({ spine: [] })

    // spine=[] is truthy so the component renders its footer element (does not
    // return null). Chapter navigation buttons are hidden (index 0 is both first
    // and "last" of an empty spine), but the page-next button may appear because
    // `currentSpineItemIndex !== spine.length - 1` evaluates as `0 !== -1`.
    // This edge-case behaviour is a known quirk tracked in TASK-009.
    expect(container.querySelector('.bber-controls__footer')).toBeTruthy()

    // Chapter-prev (li[0]) and chapter-next (li[3]) must not show
    const lis = container.querySelectorAll('.bber-li')
    expect(lis[0].querySelector('button')).toBeNull()
    expect(lis[3].querySelector('button')).toBeNull()
  })

  test('hides "prev chapter" button on the first chapter', () => {
    const { container } = renderFooter({ currentSpineItemIndex: 0 })

    // Chapter-prev is the first <li>; if it shows, there would be a button inside
    const lis = container.querySelectorAll('.bber-li')
    expect(lis[0].querySelector('button')).toBeNull()
  })

  test('shows "next chapter" button when there is a chapter after the current one', () => {
    // On chapter 0 of a 2-chapter spine
    const { container } = renderFooter({ currentSpineItemIndex: 0 })

    const lis = container.querySelectorAll('.bber-li')
    // 4 <li> elements: [chapter-prev, page-prev, page-next, chapter-next]
    expect(lis).toHaveLength(4)
    // chapter-next (last li) should have a button
    expect(lis[3].querySelector('button')).toBeTruthy()
  })

  test('hides "next chapter" button on the last chapter', () => {
    const spine = makeTwoChapterSpine()
    const { container } = renderFooter({
      spine,
      currentSpineItemIndex: spine.length - 1,
    })

    const lis = container.querySelectorAll('.bber-li')
    // chapter-next (last li) should NOT have a button
    expect(lis[3].querySelector('button')).toBeNull()
  })

  test('shows "prev chapter" button when not on the first chapter', () => {
    const { container } = renderFooter({ currentSpineItemIndex: 1 })

    const lis = container.querySelectorAll('.bber-li')
    // chapter-prev (first li) should have a button
    expect(lis[0].querySelector('button')).toBeTruthy()
  })

  test('hides page navigation buttons in columns layout on first page of first chapter', () => {
    // On the very first page (chapter 0, spread 0), both page-prev and page-next
    // should be hidden (no page before this one)
    const spine = makeTwoChapterSpine()
    const { container } = renderFooter({
      spine,
      currentSpineItemIndex: 0,
      spreadIndex: 0,
      lastSpreadIndex: 2,
    })

    const lis = container.querySelectorAll('.bber-li')
    // page-prev (li[1]) — not on first page of chapter 0
    expect(lis[1].querySelector('button')).toBeNull()
  })
})
