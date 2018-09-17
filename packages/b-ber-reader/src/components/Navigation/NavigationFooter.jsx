import React from 'react'
import {debug} from '../../config'

const NavigationFooter = props => (
    <footer className='controls__footer' style={debug ? {opacity: 0.4} : {}}>
        <nav>
            <ul>
                <li>
                    <button
                        className='material-icons nav__button'
                        style={props.uiOptions.navigation.footer_icons.chapter ? {} : {display: 'none'}}
                        onClick={_ => {
                            if (props.handleEvents === false) return
                            props.handleChapterNavigation(-1)
                        }}
                    >arrow_back
                    </button>
                </li>
                <li>
                    <button
                        className='material-icons nav__button'
                        style={props.uiOptions.navigation.footer_icons.page && props.currentSpineItemIndex !== 0 ? {} : {display: 'none'}}
                        onClick={_ => {
                            if (props.handleEvents === false) return
                            props.enablePageTransitions()
                            props.handlePageNavigation(-1)
                        }}
                    >chevron_left
                    </button>
                </li>
                <li>
                    <button
                        className='material-icons nav__button'
                        style={props.uiOptions.navigation.footer_icons.page && props.currentSpineItemIndex !== (props.spine.length - 1) ? {} : {display: 'none'}}
                        onClick={_ => {
                            if (props.handleEvents === false) return
                            props.enablePageTransitions()
                            props.handlePageNavigation(1)
                        }}
                    >chevron_right
                    </button>
                </li>
                <li>
                    <button
                        className='material-icons nav__button'
                        style={props.uiOptions.navigation.footer_icons.chapter ? {} : {display: 'none'}}
                        onClick={_ => {
                            if (props.handleEvents === false) return
                            props.handleChapterNavigation(1)
                        }}
                    >arrow_forward
                    </button>
                </li>
            </ul>
        </nav>
    </footer>
)

export default NavigationFooter
