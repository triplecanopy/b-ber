import React, { Component } from 'react'
import { NavigationHeader, NavigationFooter } from './Navigation'
import {
  SidebarMetadata,
  SidebarDownloads,
  SidebarChapters,
  SidebarSettings,
} from './Sidebar'
import Messenger from '../lib/Messenger'
import { messagesTypes } from '../constants'

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

    Messenger.register(e => {
      if (!e.origin || e.origin !== window.location.origin) {
        this.props.handleSidebarButtonClick(null)
      }
    }, messagesTypes.CLICK_EVENT)

    Messenger.register(({ data }) => {
      if (this.props.handleEvents === false) return

      const { scope, delta } = data

      if (scope === 'page') {
        this.props.enablePageTransitions()
        return this.props.handlePageNavigation(delta)
      }
      if (scope === 'chapter') {
        return this.props.handleChapterNavigation(delta)
      }
    }, messagesTypes.NAVIGATION_EVENT)
  }

  componentWillUnmount() {
    this.unbindEvents()
  }

  handleClick(e) {
    if (this.props.handleEvents === false) return

    Messenger.sendClickEvent(e)

    if (
      e.target.closest('.bber-controls__sidebar') === null &&
      e.target.closest('.bber-nav__button') === null &&
      this.props.showSidebar
    ) {
      this.props.handleSidebarButtonClick(null)
    }
  }

  handleKeyDown(e) {
    if (this.props.handleEvents === false) return
    if (!e || typeof e.which === 'undefined') return

    Messenger.sendKeydownEvent(e)

    switch (e.which) {
      case 37 /* arrow left */:
        this.props.enablePageTransitions()
        this.props.handlePageNavigation(-1)
        this.props.handleSidebarButtonClick(null)
        break
      case 39 /* arrow right */:
        this.props.enablePageTransitions()
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
    return (
      <div className="bber-controls">
        <NavigationHeader {...this.props} />
        <SidebarChapters {...this.props} />
        <SidebarDownloads {...this.props} />
        <SidebarMetadata {...this.props} />
        <SidebarSettings {...this.props} />

        {this.props.children}

        <NavigationFooter {...this.props} />
      </div>
    )
  }
}

export default Controls
