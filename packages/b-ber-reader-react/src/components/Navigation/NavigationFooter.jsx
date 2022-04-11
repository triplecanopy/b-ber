import React from 'react'
import Viewport from '../../helpers/Viewport'
import { layouts } from '../../constants'

const styles = {
  chapter: {
    prev: props =>
      (!Viewport.isMobile() &&
        !props.uiOptions.navigation.footer_icons.chapter) ||
      props.currentSpineItemIndex === 0
        ? { display: 'none' }
        : {},

    next: props =>
      (!Viewport.isMobile() &&
        !props.uiOptions.navigation.footer_icons.chapter) ||
      props.currentSpineItemIndex === props.spine.length - 1
        ? { display: 'none' }
        : {},
  },
  page: {
    prev: props =>
      props.layout === layouts.SCROLL ||
      Viewport.isMobile() ||
      !props.uiOptions.navigation.footer_icons.page ||
      (props.currentSpineItemIndex === 0 && props.spreadIndex === 0)
        ? { display: 'none' }
        : {},

    next: props =>
      props.layout === layouts.SCROLL ||
      Viewport.isMobile() ||
      !props.uiOptions.navigation.footer_icons.page ||
      (props.currentSpineItemIndex === props.spine.length - 1 &&
        props.spreadIndex === props.lastSpreadIndex)
        ? { display: 'none' }
        : {},
  },
}

function NavigationFooter(props) {
  return (
    <footer className="bber-controls__footer">
      <nav>
        <ul>
          <li>
            <button
              className="material-icons bber-nav__button"
              style={styles.chapter.prev(props)}
              onClick={props.goToPrevChapter}
            >
              arrow_back
            </button>
          </li>
          <li>
            <button
              className="material-icons bber-nav__button"
              style={styles.page.prev(props)}
              onClick={props.goToPrevPage}
            >
              chevron_left
            </button>
          </li>
          <li>
            <button
              className="material-icons bber-nav__button"
              style={styles.page.next(props)}
              onClick={props.goToNextPage}
            >
              chevron_right
            </button>
          </li>
          <li>
            <button
              className="material-icons bber-nav__button"
              style={styles.chapter.next(props)}
              onClick={props.goToNextChapter}
            >
              arrow_forward
            </button>
          </li>
        </ul>
      </nav>
    </footer>
  )
}

export default NavigationFooter
