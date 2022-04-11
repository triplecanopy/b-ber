import React from 'react'
import classNames from 'classnames'

function SidebarMetadata(props) {
  return (
    <nav
      className={classNames(
        'bber-nav',
        'bber-controls__sidebar',
        'bber-controls__sidebar__metadata',
        {
          'bber-controls__sidebar__metadata--open':
            props.showSidebar === 'metadata',
        }
      )}
    >
      <dl className="bber-dl">
        {Object.keys(props.metadata).map((key, i) => {
          if (!key || !props.metadata[key]) return null
          return (
            <div key={i}>
              <dt className="bber-dt">{key}</dt>
              <dd className="bber-dd">{props.metadata[key]}</dd>
            </div>
          )
        })}
      </dl>
    </nav>
  )
}

export default SidebarMetadata
