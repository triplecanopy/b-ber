import React from 'react'
import classNames from 'classnames'

function NestedChapterList(props) {
  const { current, items } = props
  const depth = props.depth || 0
  const items_ = items.filter(item => item.depth === depth && item.inTOC)

  return (
    <ol className="bber-ol">
      {items_.map((item, i) => (
        <li className="bber-li" key={item.id}>
          <button
            onClick={() => props.navigateToChapterByURL(item.absoluteURL)}
            className={classNames(`bber-button bber-indent--${depth + 1}`, {
              'bber-chapter--current': current === item.id,
            })}
          >
            {item.title || `Chapter ${depth}.${i}`}
          </button>

          {item.children.length > 0 && (
            <NestedChapterList
              current={current}
              items={item.children}
              depth={depth + 1}
              navigateToChapterByURL={props.navigateToChapterByURL}
            />
          )}
        </li>
      ))}
    </ol>
  )
}

function SidebarChapters(props) {
  return (
    <nav
      className={classNames(
        'bber-nav',
        'bber-controls__sidebar',
        'bber-controls__sidebar__chapters',
        {
          'bber-controls__sidebar__chapters--open':
            props.showSidebar === 'chapters',
        }
      )}
    >
      <NestedChapterList
        items={[...props.spine]}
        current={(props.spine[props.currentSpineItemIndex || 0] || {}).id}
        navigateToChapterByURL={props.navigateToChapterByURL}
      />
    </nav>
  )
}

export default SidebarChapters
