/* eslint-disable camelcase */
/* eslint-disable react/button-has-type */

import classNames from 'classnames'
import React from 'react'
import { SidebarChapters, SidebarDownloads, SidebarMetadata } from '../Sidebar'
import { Close, Download, Home, Info, Menu } from './Icon'

export function NavigationHeader(props) {
  if (!props || !props.uiOptions?.navigation?.header_icons) return null

  const {
    showSidebar,
    downloads,
    spine,
    currentSpineItemIndex,
    navigateToChapterByURL,
    metadata,
  } = props

  const { toc, home, info } = props.uiOptions.navigation.header_icons
  const settings = false // Never implemented. Maybe some day?

  const handleChapterClick = () => props.handleSidebarButtonClick('chapters')
  const handleSettingsClick = () => props.handleSidebarButtonClick('settings')
  const handleMetadataClick = () => props.handleSidebarButtonClick('metadata')
  const handleDownloadsClick = () => props.handleSidebarButtonClick('downloads')

  return (
    <header className="bber-controls__header">
      <nav className="bber-nav">
        <ul className="bber-ul">
          {home && (
            <li className="bber-li bber-li-home">
              <button
                className="bber-button bber-nav__button"
                onClick={props.destroyReaderComponent}
              >
                <Home />
              </button>
            </li>
          )}

          <li className="bber-li">
            <ul className="bber-ul">
              {toc && (
                <li className="bber-li bber-li-toc">
                  <button
                    className={classNames('bber-button', 'bber-nav__button', {
                      'bber-nav__button--open': showSidebar === 'chapters',
                    })}
                    onClick={handleChapterClick}
                  >
                    {showSidebar === 'chapters' ? <Close /> : <Menu />}
                  </button>

                  <SidebarChapters
                    showSidebar={showSidebar}
                    spine={spine}
                    currentSpineItemIndex={currentSpineItemIndex}
                    navigateToChapterByURL={navigateToChapterByURL}
                  />
                </li>
              )}

              {downloads.length > 0 && (
                <li className="bber-li bber-li-downloads">
                  <button
                    className={classNames('bber-button', 'bber-nav__button', {
                      'bber-nav__button--open': showSidebar === 'downloads',
                    })}
                    onClick={handleDownloadsClick}
                  >
                    {showSidebar === 'downloads' ? <Close /> : <Download />}
                  </button>

                  <SidebarDownloads
                    showSidebar={showSidebar}
                    downloads={downloads}
                  />
                </li>
              )}

              {settings && (
                <li className="bber-li bber-li-settings">
                  <button
                    className={classNames('bber-button', 'bber-nav__button', {
                      'bber-nav__button--open': showSidebar === 'settings',
                    })}
                    onClick={handleSettingsClick}
                  >
                    <Home />
                  </button>
                </li>
              )}

              {info && (
                <li className="bber-li bber-li-info">
                  <button
                    className={classNames('bber-button', 'bber-nav__button', {
                      'bber-nav__button--open': showSidebar === 'metadata',
                    })}
                    onClick={handleMetadataClick}
                  >
                    {showSidebar === 'metadata' ? <Close /> : <Info />}
                  </button>

                  <SidebarMetadata
                    showSidebar={showSidebar}
                    metadata={metadata}
                  />
                </li>
              )}
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default NavigationHeader
