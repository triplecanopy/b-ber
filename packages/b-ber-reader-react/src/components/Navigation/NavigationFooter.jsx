import React, { useMemo } from 'react'
import Viewport from '../../helpers/Viewport'
import { ChapterNext, ChapterPrevious, PageNext, PagePrevious } from './Icon'

function NavigationFooter(props) {
  const show = useMemo(
    () => ({
      chapter: {
        prev: p => {
          // Don't show if on the first page
          if (p.currentSpineItemIndex < 1) return false

          // Only show if the user has not set `footer_icons.chapter` to
          // false, or if it's a scrolling layout
          return (
            p.uiOptions.navigation.footer_icons.chapter ||
            Viewport.isVerticallyScrolling(p)
          )
        },

        next: p => {
          // Don't show if on the last page
          if (p.currentSpineItemIndex >= p.spine.length - 1) return false

          // Only show if the user has not set `footer_icons.chapter` to
          // false, or if it's a scrolling layout
          return (
            p.uiOptions.navigation.footer_icons.chapter ||
            Viewport.isVerticallyScrolling(p)
          )
        },
      },
      page: {
        prev: p =>
          !Viewport.isVerticallyScrolling(p) &&
          p.uiOptions.navigation.footer_icons.page &&
          (p.currentSpineItemIndex !== 0 || p.spreadIndex !== 0),

        next: p =>
          !Viewport.isVerticallyScrolling(p) &&
          p.uiOptions.navigation.footer_icons.page &&
          (p.currentSpineItemIndex !== p.spine.length - 1 ||
            p.spreadIndex !== p.lastSpreadIndex),
      },
    }),
    [
      props.currentSpineItemIndex,
      props.uiOptions.navigation.footer_icons.chapter,
      props.spine.length,
      props.uiOptions.navigation.footer_icons.page,
      props.spreadIndex,
      props.lastSpreadIndex,
    ]
  )

  return (
    <footer className="bber-controls__footer">
      <nav className="bber-nav">
        <ul className="bber-ul">
          <li className="bber-li">
            {show.chapter.prev(props) && (
              <button
                className="bber-button bber-nav__button"
                onClick={props.goToPrevChapter}
              >
                <ChapterPrevious />
              </button>
            )}
          </li>
          <li className="bber-li">
            {show.page.prev(props) && (
              <button
                className="bber-button bber-nav__button bber-nav__button--page-prev"
                onClick={props.goToPrevPage}
              >
                <PagePrevious />
              </button>
            )}
          </li>
          <li className="bber-li">
            {show.page.next(props) && (
              <button
                className="bber-button bber-nav__button bber-nav__button--page-next"
                onClick={props.goToNextPage}
              >
                <PageNext />
              </button>
            )}
          </li>
          <li className="bber-li">
            {show.chapter.next(props) && (
              <button
                className="bber-button bber-nav__button"
                onClick={props.goToNextChapter}
              >
                <ChapterNext />
              </button>
            )}
          </li>
        </ul>
      </nav>
    </footer>
  )
}

export default NavigationFooter
