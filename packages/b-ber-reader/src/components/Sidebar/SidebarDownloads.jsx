import React from 'react'
import classNames from 'classnames'

const SidebarDownloads = props => (
    <nav
        className={classNames(
            'controls__sidebar',
            'controls__sidebar__downloads',
            {'controls__sidebar__downloads--open': props.showSidebar === 'downloads'}
        )}
    >
        <div>downloads</div>
    </nav>
)

export default SidebarDownloads
