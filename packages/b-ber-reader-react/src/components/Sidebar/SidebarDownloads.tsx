import classNames from 'classnames'
import React from 'react'
import useMaxHeight from '../../hooks/use-max-height'
import { useStore } from '../../store/StoreContext'
import type { Download } from '../../store/types'

type SidebarName = 'chapters' | 'downloads' | 'metadata' | 'settings'

interface SidebarDownloadLinkProps {
  url: string
  label: string
  description?: string
}

function SidebarDownloadLink({
  url,
  label,
  description,
}: SidebarDownloadLinkProps) {
  const handleClick = () => {}

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

interface SidebarDownloadsProps {
  showSidebar: SidebarName | null
  downloads: Download[]
}

function SidebarDownloads(props: SidebarDownloadsProps) {
  // All hooks must run unconditionally and in the same order every render —
  // useMaxHeight stays above the early returns below (a conditional call would
  // change the hook count when the sidebar opens/closes and crash the tree).
  const readerSettings = useStore((s) => s.readerSettings)
  const [ref, maxHeight] = useMaxHeight()

  if (readerSettings.SidebarDownloads) {
    // Consumer override is stored as a ComponentType but invoked as a plain
    // render function (its original JS contract); cast to match that call.
    const Override = readerSettings.SidebarDownloads as (
      p: SidebarDownloadsProps
    ) => React.ReactElement
    return Override(props)
  }

  if (props.showSidebar !== 'downloads') return null

  return (
    <nav
      ref={ref}
      style={{ maxHeight }}
      className={classNames(
        'bber-nav',
        'bber-controls__sidebar',
        'bber-controls__sidebar__downloads',
        'bber-controls__sidebar__downloads--open'
      )}
    >
      <ul className="bber-ul">
        {props.downloads.map((download) => (
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

export default SidebarDownloads
