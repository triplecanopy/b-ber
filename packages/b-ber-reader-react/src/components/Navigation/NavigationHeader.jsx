/* eslint-disable react/button-has-type */

import React from 'react'
import { debug } from '../../config'

function ListItemDownloads(props) {
  if (!props.downloads || !props.downloads.length) return null
  const { header_icons: headerIcons } = props.uiOptions.navigation

  return (
    <li>
      <button
        className="material-icons bber-nav__button bber-nav__button__downloads"
        onClick={() => props.handleSidebarButtonClick('downloads')}
        style={headerIcons.downloads ? {} : { display: 'none' }}
      >
        file_download
      </button>
    </li>
  )
}

export function NavigationHeader(props) {
  const { header_icons: headerIcons } = props.uiOptions.navigation
  return (
    <header
      className="bber-controls__header"
      style={debug ? { opacity: 0.4 } : {}}
    >
      <nav>
        <ul>
          <li>
            <button
              className="material-icons bber-nav__button bber-nav__button__chapters"
              onClick={props.destroyReaderComponent}
              style={headerIcons.home ? {} : { display: 'none' }}
            >
              menu
            </button>
          </li>
          <li>
            <button
              className="material-icons bber-nav__button bber-nav__button__chapters"
              onClick={() => props.handleSidebarButtonClick('chapters')}
              style={headerIcons.toc ? {} : { display: 'none' }}
            >
              view_list
            </button>
          </li>
          <li>
            <button
              className="material-icons bber-nav__button bber-nav__button__settings"
              onClick={() => props.handleSidebarButtonClick('settings')}
            >
              settings
            </button>
          </li>

          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <ListItemDownloads {...props} />

          <li>
            <button
              className="material-icons bber-nav__button bber-nav__button__metadata"
              onClick={() => props.handleSidebarButtonClick('metadata')}
              style={headerIcons.info ? {} : { display: 'none' }}
            >
              info_outline
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default NavigationHeader
