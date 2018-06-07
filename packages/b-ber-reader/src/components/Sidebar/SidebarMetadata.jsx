import React from 'react'
import classNames from 'classnames'

const SidebarMetadata = props => (
    <nav
        className={classNames(
            'controls__sidebar',
            'controls__sidebar__metadata',
            {'controls__sidebar__metadata--open': props.showSidebar === 'metadata'}
        )}
    >
        <dl>
            {Object.keys(props.metadata).map((key, i) => {
                if (key && props.metadata[key]) {
                    return (
                        <div key={i}>
                            <dt>{key}</dt>
                            <dd>{props.metadata[key]}</dd>
                        </div>
                    )
                }
                return null
            })}
        </dl>
    </nav>
)

export default SidebarMetadata
