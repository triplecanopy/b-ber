import React from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'
import useMaxHeight from '../../hooks/use-max-height'

function SidebarMetadata(props) {
  if (props.readerSettings.SidebarMetadata) {
    return props.readerSettings.SidebarMetadata(props)
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

export default connect(({ readerSettings }) => ({ readerSettings }))(
  SidebarMetadata
)
