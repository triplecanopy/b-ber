import classNames from 'classnames'
import React from 'react'
import type { Download } from '../../store/types'
import { Close, FileDownload as DownloadIcon, Home, Info, Menu } from '../Icons'
import { SidebarChapters, SidebarDownloads, SidebarMetadata } from '../Sidebar'

type SidebarName = 'chapters' | 'downloads' | 'metadata' | 'settings'

interface HeaderIcons {
  home?: boolean
  toc?: boolean
  downloads?: boolean
  info?: boolean
}

interface SpineItem {
  absoluteURL: string
  children: SpineItem[]
  depth: number
  id: string
  inTOC: boolean
  title: string
}

type Spine = SpineItem[]

type Metadata = Record<string, string>

interface NavigationHeaderProps {
  destroyReaderComponent: () => void
  handleSidebarButtonClick: (name: SidebarName) => void
  navigateToChapterByURL: (url: string) => void
  downloads: Download[]
  uiOptions: {
    navigation?: {
      header_icons?: HeaderIcons
    }
  }
  showSidebar: SidebarName | null
  spine: Spine
  currentSpineItemIndex: number
  metadata: Metadata
}

export function NavigationHeader(props: NavigationHeaderProps) {
  if (!props || !props.uiOptions?.navigation?.header_icons) return null

  const {
    showSidebar,
    downloads: downloadItems,
    spine,
    currentSpineItemIndex,
    navigateToChapterByURL,
    metadata,
  } = props

  const { toc, home, info, downloads } = props.uiOptions.navigation.header_icons
  const settings = false // Never implemented. Maybe some day?

  const handleChapterClick = () => props.handleSidebarButtonClick('chapters')
  const handleSettingsClick = () => props.handleSidebarButtonClick('settings')
  const handleMetadataClick = () => props.handleSidebarButtonClick('metadata')
  const handleDownloadsClick = () => props.handleSidebarButtonClick('downloads')

  return (
    <header className="bber-controls__header">
      <nav className="bber-nav">
        <ul className="bber-ul">
          <li className="bber-li bber-li-home">
            {home && (
              <button
                className="bber-button bber-nav__button"
                onClick={props.destroyReaderComponent}
              >
                <Home />
              </button>
            )}
          </li>

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

              {downloads && downloadItems.length > 0 && (
                <li className="bber-li bber-li-downloads">
                  <button
                    className={classNames('bber-button', 'bber-nav__button', {
                      'bber-nav__button--open': showSidebar === 'downloads',
                    })}
                    onClick={handleDownloadsClick}
                  >
                    {showSidebar === 'downloads' ? <Close /> : <DownloadIcon />}
                  </button>

                  <SidebarDownloads
                    showSidebar={showSidebar}
                    downloads={downloadItems}
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
