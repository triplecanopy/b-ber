import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { NavigationHeader, NavigationFooter } from './Navigation'
import Messenger from '../lib/Messenger'
import withNavigationActions from '../lib/with-navigation-actions'
import { messagesTypes } from '../constants'
import * as userInterfaceActions from '../actions/user-interface'

class Controls extends Component {
  constructor(props) {
    super(props)

    this.bindEvents = this.bindEvents.bind(this)
    this.unbindEvents = this.unbindEvents.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this.bindEvents()

    // Messenger.register(e => {
    //   if (!e.origin || e.origin !== window.location.origin) {
    //     this.props.handleSidebarButtonClick(null)
    //   }
    // }, messagesTypes.CLICK_EVENT)

    // Messenger.register(({ data }) => {
    //   if (this.props.userInterface.handleEvents === false) return

    //   const { scope, delta } = data

    //   if (scope === 'page') {
    //     this.props.userInterfaceActions.enablePageTransitions()
    //     return this.props.handlePageNavigation(delta)
    //   }

    //   if (scope === 'chapter') {
    //     return this.props.handleChapterNavigation(delta)
    //   }
    // }, messagesTypes.NAVIGATION_EVENT)
  }

  componentWillUnmount() {
    this.unbindEvents()
  }

  handleClick(e) {
    if (this.props.userInterface.handleEvents === false) return

    // Messenger.sendClickEvent(e)

    if (
      e.target.closest('.bber-controls__sidebar') === null &&
      e.target.closest('.bber-nav__button') === null &&
      this.props.showSidebar
    ) {
      this.props.handleSidebarButtonClick(null)
    }
  }

  handleKeyDown(e) {
    if (this.props.userInterface.handleEvents === false) return
    if (!e || typeof e.which === 'undefined') return

    // Messenger.sendKeydownEvent(e)

    switch (e.which) {
      case 37 /* arrow left */:
        this.props.userInterfaceActions.enablePageTransitions()
        this.props.handlePageNavigation(-1)
        this.props.handleSidebarButtonClick(null)
        break
      case 39 /* arrow right */:
        this.props.userInterfaceActions.enablePageTransitions()
        this.props.handlePageNavigation(1)
        this.props.handleSidebarButtonClick(null)
        break
      case 27 /* ESC */:
        this.props.handleSidebarButtonClick(null)
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

  bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('click', this.handleClick)
    document.addEventListener('touchstart', this.handleClick)
  }

  unbindEvents() {
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('click', this.handleClick)
    document.removeEventListener('touchstart', this.handleClick)
  }

  render() {
    const { readerSettings } = this.props

    const Header = readerSettings.NavigationHeader || NavigationHeader
    const Footer = withNavigationActions(
      readerSettings.NavigationFooter || NavigationFooter
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
    } = this.props

    const { enablePageTransitions } = this.props.userInterfaceActions
    const { handleEvents } = this.props.userInterface

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

        {this.props.children}

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
