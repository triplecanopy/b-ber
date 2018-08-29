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
                        style={props.uiOptions.navigation.header_icons.home ? {} : {display: 'none'}}
                    >menu
                    </button>
                </li>
                <li>
                    <button
                        className='material-icons nav__button nav__button__chapters'
                        onClick={_ => props.handleSidebarButtonClick('chapters')}
                        style={props.uiOptions.navigation.header_icons.toc ? {} : {display: 'none'}}
                    >view_list
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
                        style={props.uiOptions.navigation.header_icons.downloads ? {} : {display: 'none'}}
                    >file_download
                    </button>
                </li>
                <li>
                    <button
                        className='material-icons nav__button nav__button__metadata'
                        onClick={_ => props.handleSidebarButtonClick('metadata')}
                        style={props.uiOptions.navigation.header_icons.info ? {} : {display: 'none'}}
                    >info_outline
                    </button>
                </li>
            </ul>
        </nav>
    </header>
)

export default NavigationHeader
