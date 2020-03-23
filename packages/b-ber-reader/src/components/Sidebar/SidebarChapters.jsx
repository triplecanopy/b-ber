import React from 'react'
import classNames from 'classnames'

const NestedChapterList = props => {
  const { current, items } = props
  const depth = props.depth || 0
  const items_ = items.filter(a => a.depth === depth && a.inTOC)

  return (
    <ol>
      {items_.map((item, i) => (
        <li key={i}>
          <button
            onClick={() => props.navigateToChapterByURL(item.absoluteURL)}
            className={classNames(`indent--${depth + 1}`, {
              'chapter--current': current === item.id,
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

const SidebarChapters = props => (
  <nav
    className={classNames('controls__sidebar', 'controls__sidebar__chapters', {
      'controls__sidebar__chapters--open': props.showSidebar === 'chapters',
    })}
  >
    <NestedChapterList
      items={[...props.spine]}
      current={(props.spine[props.currentSpineItemIndex || 0] || {}).id}
      navigateToChapterByURL={props.navigateToChapterByURL}
    />
  </nav>
)

export default SidebarChapters
