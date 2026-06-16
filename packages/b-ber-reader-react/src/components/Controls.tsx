import React, { useEffect } from 'react'
import useNavigationActions from '../hooks/use-navigation-actions'
import { useStore } from '../store/StoreContext'
import { useUserInterfaceActions } from '../store/userInterfaceActions'
import { NavigationFooter, NavigationHeader } from './Navigation'

// Controls receives a broad set of props from Reader (navigation callbacks,
// spine/guide data); readerSettings and userInterface are read from the
// built-in store (TASK-106). The owner-supplied callbacks are loosely typed
// pending the navigation-hooks refactor, so props are `any` here.
// TODO: tighten once the Reader prop surface is finalized.
function Controls(props: any) {
  const readerSettings = useStore((s) => s.readerSettings)
  const userInterface = useStore((s) => s.userInterface)
  const uiActions = useUserInterfaceActions()

  // Bound to click and touchstart; typed as the common Event and the target is
  // narrowed to Element to use closest().
  const handleClick = (e: Event) => {
    if (!userInterface.handleEvents) return

    const target = e.target as Element

    if (
      target.closest('.bber-controls__sidebar') === null &&
      target.closest('.bber-nav__button') === null &&
      props.showSidebar
    ) {
      props.handleSidebarButtonClick(null)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!userInterface.handleEvents) return
    if (!e || typeof e.which === 'undefined') return

    switch (e.which) {
      case 37 /* arrow left */:
        uiActions.enablePageTransitions()
        props.handlePageNavigation(-1)
        props.handleSidebarButtonClick(null)
        break
      case 39 /* arrow right */:
        uiActions.enablePageTransitions()
        props.handlePageNavigation(1)
        props.handleSidebarButtonClick(null)
        break
      case 27 /* ESC */:
        props.handleSidebarButtonClick(null)
        break
      case 80 /* p */:
        if (e.metaKey) {
          e.preventDefault()
          e.stopImmediatePropagation()
          window.print()
        }
        break
      default:
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClick)
    document.addEventListener('touchstart', handleClick)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [userInterface.handleEvents, props.showSidebar])

  const Header = readerSettings.NavigationHeader || NavigationHeader
  const Footer = readerSettings.NavigationFooter || NavigationFooter

  const {
    destroyReaderComponent,
    handleSidebarButtonClick,
    downloads,
    uiOptions,
    currentSpineItemIndex,
    spine,
    layout,
    metadata,
    showSidebar,
    spreadIndex,
    lastSpreadIndex,
    handleChapterNavigation,
    handlePageNavigation,
    navigateToChapterByURL,
  } = props

  const { goToPrevChapter, goToNextChapter, goToPrevPage, goToNextPage } =
    useNavigationActions(handleChapterNavigation, handlePageNavigation)

  return (
    <div className="bber-controls">
      <Header
        destroyReaderComponent={destroyReaderComponent}
        handleSidebarButtonClick={handleSidebarButtonClick}
        downloads={downloads}
        uiOptions={uiOptions}
        showSidebar={showSidebar}
        spine={spine}
        currentSpineItemIndex={currentSpineItemIndex}
        navigateToChapterByURL={navigateToChapterByURL}
        metadata={metadata}
      />

      {props.children}

      <Footer
        uiOptions={uiOptions}
        currentSpineItemIndex={currentSpineItemIndex}
        spine={spine}
        layout={layout}
        spreadIndex={spreadIndex}
        lastSpreadIndex={lastSpreadIndex}
        goToPrevChapter={goToPrevChapter}
        goToNextChapter={goToNextChapter}
        goToPrevPage={goToPrevPage}
        goToNextPage={goToNextPage}
      />
    </div>
  )
}

export default Controls
