import classNames from 'classnames'
import React from 'react'
import useMaxHeight from '../../hooks/use-max-height'
import { useStore } from '../../store/StoreContext'

// Local equivalents of the package's public prop contracts (documented in the
// root index.d.ts). Defined locally rather than imported from the .d.ts.
type SidebarName = 'chapters' | 'downloads' | 'metadata' | 'settings'

interface SpineItem {
  absoluteURL: string
  children: SpineItem[]
  depth: number
  id: string
  inTOC: boolean
  title: string
}

type Spine = SpineItem[]

interface NestedChapterListProps {
  current: string | undefined
  items: SpineItem[]
  depth?: number
  navigateToChapterByURL: (url: string) => void
}

function NestedChapterList(props: NestedChapterListProps) {
  const { current, items } = props
  const depth = props.depth || 0
  const items_ = items.filter((item) => item.depth === depth && item.inTOC)

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

interface SidebarChaptersProps {
  showSidebar: SidebarName | null
  spine: Spine
  currentSpineItemIndex: number
  navigateToChapterByURL: (url: string) => void
}

function SidebarChapters(props: SidebarChaptersProps) {
  const readerSettings = useStore((s) => s.readerSettings)

  if (readerSettings.SidebarChapters) {
    // Consumer override is stored as a ComponentType but invoked as a plain
    // render function (its original JS contract); cast to match that call.
    const Override = readerSettings.SidebarChapters as (
      p: SidebarChaptersProps
    ) => React.ReactElement
    return Override(props)
  }

  if (props.showSidebar !== 'chapters') return null

  const [ref, maxHeight] = useMaxHeight()

  return (
    <nav
      ref={ref}
      style={{ maxHeight }}
      className={classNames(
        'bber-nav',
        'bber-controls__sidebar',
        'bber-controls__sidebar__chapters',
        'bber-controls__sidebar__chapters--open'
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
