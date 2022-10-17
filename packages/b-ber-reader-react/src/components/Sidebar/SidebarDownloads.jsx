/* eslint-disable react/button-has-type */

import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import Messenger from '../../lib/Messenger'

function SidebarDownloadLink({ url, label, description }) {
  const handleClick = () => Messenger.sendDownloadEvent(url)

  return (
    <li className="bber-li">
      <a className="bber-a" download href={url} onClick={handleClick}>
        <div className="bber-downloads__title">{label}</div>

        {description && (
          <div className="bber-downloads__description">{description}</div>
        )}
      </a>
    </li>
  )
}

function SidebarDownloads(props) {
  if (props.readerSettings.SidebarDownloads) {
    return props.readerSettings.SidebarDownloads(props)
  }

  if (props.showSidebar !== 'downloads') return null

  const node = useRef()

  const [maxHeight, setMaxHeight] = useState('0px')

  const updateMaxHeight = () => {
    const { y } = node.current.getBoundingClientRect()
    setMaxHeight(window.innerHeight - y)
  }

  useEffect(() => {
    updateMaxHeight()
  }, [node])

  useEffect(() => {
    window.addEventListener('resize', updateMaxHeight)

    return () => window.removeEventListener('resize', updateMaxHeight)
  }, [])

  return (
    <nav
      ref={node}
      style={{ maxHeight }}
      className={classNames(
        'bber-nav',
        'bber-controls__sidebar',
        'bber-controls__sidebar__downloads',
        'bber-controls__sidebar__downloads--open'
      )}
    >
      <ul className="bber-ul">
        {props.downloads.map(download => (
          <SidebarDownloadLink
            key={download.url}
            url={download.url}
            label={download.label}
            description={download.description}
          />
        ))}
      </ul>
    </nav>
  )
}

export default connect(({ readerSettings }) => ({ readerSettings }))(
  SidebarDownloads
)
