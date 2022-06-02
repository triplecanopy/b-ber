import React from 'react'
import Viewport from '../../helpers/Viewport'
import { ChapterNext, ChapterPrevious, PageNext, PagePrevious } from './Icon'

const show = {
  chapter: {
    prev: props =>
      (Viewport.isMobile() ||
        props.uiOptions.navigation.footer_icons.chapter) &&
      props.currentSpineItemIndex !== 0,

    next: props =>
      (Viewport.isMobile() ||
        props.uiOptions.navigation.footer_icons.chapter) &&
      props.currentSpineItemIndex !== props.spine.length - 1,
  },
  page: {
    prev: props =>
      !Viewport.verticallyScrolling(props) &&
      props.uiOptions.navigation.footer_icons.page &&
      (props.currentSpineItemIndex !== 0 || props.spreadIndex !== 0),

    next: props =>
      !Viewport.verticallyScrolling(props) &&
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
