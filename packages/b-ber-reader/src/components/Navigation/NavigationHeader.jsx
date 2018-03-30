import React from 'react'
import {debug} from '../../config'

const NavigationHeader = props => (
    <header className='controls__header' style={debug ? {opacity: 0.4} : {}}>
        <nav>
            <ul>
                <li>
                    <button
                        className='material-icons nav__button nav__button__chapters'
                        onClick={props.destroyReaderComponent}
                    >home
                    </button>
                </li>
                <li>
                    <button
                        className='material-icons nav__button nav__button__chapters'
                        onClick={_ => props.handleSidebarButtonClick('chapters')}
                    >menu
                    </button>
                </li>
                <li>
                    <button
                        className='material-icons nav__button nav__button__settings'
                        onClick={_ => props.handleSidebarButtonClick('settings')}
                    >settings
                    </button>
                </li>
                <li>
                    <button
                        className='material-icons nav__button nav__button__downloads'
                        onClick={_ => props.handleSidebarButtonClick('downloads')}
                    >file_download
                    </button>
                </li>
                <li>
                    <button
                        className='material-icons nav__button nav__button__metadata'
                        onClick={_ => props.handleSidebarButtonClick('metadata')}
                    >info_outline
                    </button>
                </li>
            </ul>
        </nav>
    </header>
)

export default NavigationHeader
