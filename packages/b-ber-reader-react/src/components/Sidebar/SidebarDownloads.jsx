/* eslint-disable react/button-has-type */

import React from 'react'
import classNames from 'classnames'
import Messenger from '../../lib/Messenger'

function SidebarDownloadDescription({ description }) {
  return description ? (
    <span className="bber-downloads__description">{description}</span>
  ) : null
}

function SidebarDownloads(props) {
  return (
    <nav
      className={classNames(
        'bber-nav',
        'bber-controls__sidebar',
        'bber-controls__sidebar__downloads',
        {
          'bber-controls__sidebar__downloads--open':
            props.showSidebar === 'downloads',
        }
      )}
    >
      <ul className="bber-ul">
        {props.downloads.map(download => (
          <li className="bber-li" key={download.url}>
            <a
              className="bber-a"
              download
              href={download.url}
              onClick={() => Messenger.sendDownloadEvent(download.url)}
            >
              <span className="bber-downloads__title">{download.label}</span>
              <SidebarDownloadDescription description={download.description} />
            </a>
            <button className="bber-button material-icons">
              file_download
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default SidebarDownloads
