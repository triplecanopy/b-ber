import React, { useMemo } from 'react'
import Viewport from '../../helpers/Viewport'
import { ChapterNext, ChapterPrevious, PageNext, PagePrevious } from './Icon'

interface FooterIcons {
  chapter?: boolean
  page?: boolean
}

interface SpineItem {
  id: string
}

type Spine = SpineItem[]

interface NavigationFooterProps {
  uiOptions: {
    navigation: {
      footer_icons: FooterIcons
    }
  }
  currentSpineItemIndex: number
  spine: Spine
  layout: string
  spreadIndex: number
  lastSpreadIndex: number
  goToPrevChapter: () => void
  goToNextChapter: () => void
  goToPrevPage: () => void
  goToNextPage: () => void
}

function NavigationFooter(props: NavigationFooterProps) {
  // Guard: spine is initialized as [] in Reader state, but during the brief
  // window between mount and the OPF load completing (or if the prop is not
  // yet forwarded) it can arrive as undefined. Using optional chaining in the
  // deps array prevents a crash before the hook even runs; the early return
  // below prevents rendering with missing data.
  const spineLength = props.spine?.length ?? 0

  const show = useMemo(
    () => ({
      chapter: {
        prev: (p: NavigationFooterProps) => {
          // Don't show if on the first page
          if (p.currentSpineItemIndex < 1) return false

          // Only show if the user has not set `footer_icons.chapter` to
          // false, or if it's a scrolling layout
          return (
            p.uiOptions.navigation.footer_icons.chapter ||
            Viewport.isVerticallyScrolling(p)
          )
        },

        next: (p: NavigationFooterProps) => {
          // Don't show if on the last page. Guard against spine being empty
          // or undefined (transitional state during initial load).
          const len = p.spine?.length ?? 0
          if (p.currentSpineItemIndex >= len - 1) return false

          // Only show if the user has not set `footer_icons.chapter` to
          // false, or if it's a scrolling layout
          return (
            p.uiOptions.navigation.footer_icons.chapter ||
            Viewport.isVerticallyScrolling(p)
          )
        },
      },
      page: {
        prev: (p: NavigationFooterProps) =>
          !Viewport.isVerticallyScrolling(p) &&
          p.uiOptions.navigation.footer_icons.page &&
          (p.currentSpineItemIndex !== 0 || p.spreadIndex !== 0),

        next: (p: NavigationFooterProps) => {
          // Guard against spine being empty/undefined
          const len = p.spine?.length ?? 0
          return (
            !Viewport.isVerticallyScrolling(p) &&
            p.uiOptions.navigation.footer_icons.page &&
            (p.currentSpineItemIndex !== len - 1 ||
              p.spreadIndex !== p.lastSpreadIndex)
          )
        },
      },
    }),
    [
      props.currentSpineItemIndex,
      props.uiOptions.navigation.footer_icons.chapter,
      spineLength, // use the pre-computed safe value instead of props.spine.length
      props.uiOptions.navigation.footer_icons.page,
      props.spreadIndex,
      props.lastSpreadIndex,
    ]
  )

  // Don't render until spine is available — prevents crashes from accessing
  // spine.length in the memo functions below
  if (!props.spine) return null

  return (
    <footer className="bber-controls__footer">
      <nav className="bber-nav">
        <ul className="bber-ul">
          <li className="bber-li">
            {show.chapter.prev(props) && (
              <button
                className="bber-button bber-nav__button"
                onClick={props.goToPrevChapter}
              >
                <ChapterPrevious />
              </button>
            )}
          </li>
          <li className="bber-li">
            {show.page.prev(props) && (
              <button
                className="bber-button bber-nav__button bber-nav__button--page-prev"
                onClick={props.goToPrevPage}
              >
                <PagePrevious />
              </button>
            )}
          </li>
          <li className="bber-li">
            {show.page.next(props) && (
              <button
                className="bber-button bber-nav__button bber-nav__button--page-next"
                onClick={props.goToNextPage}
              >
                <PageNext />
              </button>
            )}
          </li>
          <li className="bber-li">
            {show.chapter.next(props) && (
              <button
                className="bber-button bber-nav__button"
                onClick={props.goToNextChapter}
              >
                <ChapterNext />
              </button>
            )}
          </li>
        </ul>
      </nav>
    </footer>
  )
}

export default NavigationFooter
