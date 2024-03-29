import React from 'react'
import Viewport from '../../helpers/Viewport'
import { ChapterNext, ChapterPrevious, PageNext, PagePrevious } from './Icon'

const show = {
  chapter: {
    prev: props => {
      // Don't show if on the first page
      if (props.currentSpineItemIndex < 1) return false

      // Only show if the user has not set `footer_icons.chapter` to
      // false, or if it's a scrolling layout
      return (
        props.uiOptions.navigation.footer_icons.chapter ||
        Viewport.isVerticallyScrolling(props)
      )
    },

    next: props => {
      // Don't show if on the last page
      if (props.currentSpineItemIndex >= props.spine.length - 1) return false

      // Only show if the user has not set `footer_icons.chapter` to
      // false, or if it's a scrolling layout
      return (
        props.uiOptions.navigation.footer_icons.chapter ||
        Viewport.isVerticallyScrolling(props)
      )
    },
  },
  page: {
    prev: props =>
      !Viewport.isVerticallyScrolling(props) &&
      props.uiOptions.navigation.footer_icons.page &&
      (props.currentSpineItemIndex !== 0 || props.spreadIndex !== 0),

    next: props =>
      !Viewport.isVerticallyScrolling(props) &&
      props.uiOptions.navigation.footer_icons.page &&
      (props.currentSpineItemIndex !== props.spine.length - 1 ||
        props.spreadIndex !== props.lastSpreadIndex),
  },
}

function NavigationFooter(props) {
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
