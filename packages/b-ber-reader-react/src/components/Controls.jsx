import React, { useCallback, useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { NavigationHeader, NavigationFooter } from './Navigation'
import Messenger from '../lib/Messenger'
import withNavigationActions from '../lib/with-navigation-actions'
import { messagesTypes } from '../constants'
import * as userInterfaceActions from '../actions/user-interface'

function Controls(props) {
  const handleClick = e => {
    if (props.userInterface.handleEvents === false) return

    Messenger.sendClickEvent(e)

    if (
      e.target.closest('.bber-controls__sidebar') === null &&
      e.target.closest('.bber-nav__button') === null &&
      props.showSidebar
    ) {
      props.handleSidebarButtonClick(null)
    }
  }

  const handleKeyDown = e => {
    if (props.userInterface.handleEvents === false) return
    if (!e || typeof e.which === 'undefined') return

    Messenger.sendKeydownEvent(e)

    switch (e.which) {
      case 37 /* arrow left */:
        props.userInterfaceActions.enablePageTransitions()
        props.handlePageNavigation(-1)
        props.handleSidebarButtonClick(null)
        break
      case 39 /* arrow right */:
        props.userInterfaceActions.enablePageTransitions()
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

    Messenger.register(e => {
      if (!e.origin || e.origin !== window.location.origin) {
        props.handleSidebarButtonClick(null)
      }
    }, messagesTypes.CLICK_EVENT)

    Messenger.register(({ data }) => {
      if (props.userInterface.handleEvents === false) return

      const { scope, delta } = data

      if (scope === 'page') {
        props.userInterfaceActions.enablePageTransitions()
        return props.handlePageNavigation(delta)
      }

      if (scope === 'chapter') {
        return props.handleChapterNavigation(delta)
      }
    }, messagesTypes.NAVIGATION_EVENT)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [props.userInterface.handleEvents, props.showSidebar])

  const { readerSettings } = props

  const Header = useCallback(
    readerSettings.NavigationHeader || NavigationHeader,
    [readerSettings.NavigationHeader, NavigationHeader]
  )

  const Footer = useCallback(
    withNavigationActions(readerSettings.NavigationFooter || NavigationFooter),
    [readerSettings.NavigationFooter, NavigationFooter]
  )

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

  const { enablePageTransitions } = props.userInterfaceActions
  const { handleEvents } = props.userInterface

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
        handleEvents={handleEvents}
        handleChapterNavigation={handleChapterNavigation}
        enablePageTransitions={enablePageTransitions}
        handlePageNavigation={handlePageNavigation}
      />
    </div>
  )
}

export default connect(
  ({ readerSettings, viewerSettings, userInterface }) => ({
    readerSettings,
    viewerSettings,
    userInterface,
  }),
  dispatch => ({
    userInterfaceActions: bindActionCreators(userInterfaceActions, dispatch),
  })
)(Controls)
