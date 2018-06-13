import React from 'react'
import classNames from 'classnames'

const SidebarDownloads = props => (
    <nav
        className={classNames(
            'controls__sidebar',
            'controls__sidebar__downloads',
            {'controls__sidebar__downloads--open': props.showSidebar === 'downloads'}
        )}
    >
        <ul>
            <li >
                    <a download>epub3</a>
                    <button
                        className='material-icons'
                    >file_download
                    </button>
                </li>
                <li >
                    <a download>PDF</a>
                    <button
                        className='material-icons'
                    >file_download
                    </button>
                </li>
                <li >
                    <a download>Mobi</a>
                    <button
                        className='material-icons'
                    >file_download
                    </button>
                </li>
        </ul>
    </nav>
)

export default SidebarDownloads
