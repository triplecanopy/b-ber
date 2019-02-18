import React from 'react'
import Viewport from '../../helpers/Viewport'
import { debug } from '../../config'

const chapterStyles = {
    prev: props =>
        (!Viewport.isMobile() && !props.uiOptions.navigation.footer_icons.chapter) || props.currentSpineItemIndex === 0
            ? { display: 'none' }
            : {},
    next: props =>
        (!Viewport.isMobile() && !props.uiOptions.navigation.footer_icons.chapter) ||
        props.currentSpineItemIndex === props.spine.length - 1
            ? { display: 'none' }
            : {},
}

const pageStyles = {
    prev: props =>
        Viewport.isMobile() ||
        !props.uiOptions.navigation.footer_icons.page ||
        (props.currentSpineItemIndex === 0 && props.spreadIndex === 0)
            ? { display: 'none' }
            : {},
    next: props =>
        Viewport.isMobile() ||
        !props.uiOptions.navigation.footer_icons.page ||
        (props.currentSpineItemIndex === props.spine.length - 1 && props.spreadIndex === props.lastIndex)
            ? { display: 'none' }
            : {},
}

const NavigationFooter = props => (
    <footer className="controls__footer" style={debug ? { opacity: 0.4 } : {}}>
        <nav>
            <ul>
                <li>
                    <button
                        className="material-icons nav__button"
                        style={chapterStyles.prev(props)}
                        onClick={() => {
                            if (props.handleEvents === false) return
                            props.handleChapterNavigation(-1)
                        }}
                    >
                        arrow_back
                    </button>
                </li>
                <li>
                    <button
                        className="material-icons nav__button"
                        style={pageStyles.prev(props)}
                        onClick={() => {
                            if (props.handleEvents === false) return
                            props.enablePageTransitions()
                            props.handlePageNavigation(-1)
                        }}
                    >
                        chevron_left
                    </button>
                </li>
                <li>
                    <button
                        className="material-icons nav__button"
                        style={pageStyles.next(props)}
                        onClick={() => {
                            if (props.handleEvents === false) return
                            props.enablePageTransitions()
                            props.handlePageNavigation(1)
                        }}
                    >
                        chevron_right
                    </button>
                </li>
                <li>
                    <button
                        className="material-icons nav__button"
                        style={chapterStyles.next(props)}
                        onClick={() => {
                            if (props.handleEvents === false) return
                            props.handleChapterNavigation(1)
                        }}
                    >
                        arrow_forward
                    </button>
                </li>
            </ul>
        </nav>
    </footer>
)

export default NavigationFooter
