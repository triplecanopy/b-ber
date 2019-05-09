import React from 'react'
import classNames from 'classnames'
import Messenger from '../../lib/Messenger'

const SidebarDownloads = props => (
    <nav
        className={classNames('controls__sidebar', 'controls__sidebar__downloads', {
            'controls__sidebar__downloads--open': props.showSidebar === 'downloads',
        })}
    >
        <ul>
            {props.downloads.map((a, i) => (
                <li key={i}>
                    <a href={a.url} download onClick={() => Messenger.sendDownloadEvent(a.url)}>
                        <span className="downloads__title">{a.label}</span>
                        {a.description && <span className="downloads__description">{a.description}</span>}
                    </a>
                    <button className="material-icons">file_download</button>
                </li>
            ))}
        </ul>
    </nav>
)

export default SidebarDownloads
