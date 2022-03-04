import React from 'react'
import classNames from 'classnames'
import Messenger from '../../lib/Messenger'

const SidebarDownloadDescription = ({ description }) =>
  description ? (
    <span className="downloads__description">{description}</span>
  ) : null

const SidebarDownloads = props => (
  <nav
    className={classNames('controls__sidebar', 'controls__sidebar__downloads', {
      'controls__sidebar__downloads--open': props.showSidebar === 'downloads',
    })}
  >
    <ul>
      {props.downloads.map(download => (
        <li key={download.url}>
          <a
            download
            href={download.url}
            onClick={() => Messenger.sendDownloadEvent(download.url)}
          >
            <span className="downloads__title">{download.label}</span>
            <SidebarDownloadDescription description={props.description} />
          </a>
          <button className="material-icons">file_download</button>
        </li>
      ))}
    </ul>
  </nav>
)

export default SidebarDownloads
