import classNames from 'classnames'
import React from 'react'
import { connect } from 'react-redux'
import useMaxHeight from '../../hooks/use-max-height'
import type { ReaderSettingsState, RootState } from '../../store/types'

type SidebarName = 'chapters' | 'downloads' | 'metadata' | 'settings'

// Metadata is rendered via Object.entries, so the iterable record shape is what
// matters here rather than the fixed Dublin Core field set.
type Metadata = Record<string, string>

interface SidebarMetadataProps {
  showSidebar: SidebarName | null
  metadata: Metadata
  // Injected by connect; also the consumer-override slot read below.
  readerSettings: ReaderSettingsState
}

function SidebarMetadata(props: SidebarMetadataProps) {
  if (props.readerSettings.SidebarMetadata) {
    // Consumer override is stored as a ComponentType but invoked as a plain
    // render function (its original JS contract); cast to match that call.
    const Override = props.readerSettings.SidebarMetadata as (
      p: SidebarMetadataProps
    ) => React.ReactElement
    return Override(props)
  }

  if (props.showSidebar !== 'metadata') return null

  const [ref, maxHeight] = useMaxHeight()

  return (
    <nav
      ref={ref}
      style={{ maxHeight }}
      className={classNames(
        'bber-nav',
        'bber-controls__sidebar',
        'bber-controls__sidebar__metadata',
        'bber-controls__sidebar__metadata--open'
      )}
    >
      <dl className="bber-dl">
        {Object.entries(props.metadata).map(([key, value]) => {
          if (!key || !value) return null

          return (
            <div key={key}>
              <dt className="bber-dt">{key}</dt>
              <dd className="bber-dd">{value}</dd>
            </div>
          )
        })}
      </dl>
    </nav>
  )
}

export default connect(({ readerSettings }: RootState) => ({ readerSettings }))(
  SidebarMetadata
)
