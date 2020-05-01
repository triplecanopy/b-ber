import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import findIndex from 'lodash/findIndex'
import debounce from 'lodash/debounce'
import find from 'lodash/find'
import isInteger from 'lodash/isInteger'
import { Controls, Frame, Spinner } from '.'
import { Request, XMLAdaptor, Asset, Url, Cache, Storage } from '../helpers'
import { useLocalStorage } from '../config'
import history from '../lib/History'
import withDeferredCallbacks from '../lib/with-deferred-callbacks'
import ReaderContext from '../lib/reader-context'
import Messenger from '../lib/Messenger'
import Viewport from '../helpers/Viewport'
import * as viewerSettingsActions from '../actions/viewer-settings'
import * as viewActions from '../actions/view'
import { ViewerSettings } from '../models'
import { unlessDefined } from '../helpers/utils'

const book = { content: null }

const BookContent = () => <div key="book-content">{book.content}</div>

class Reader extends Component {
  constructor(props) {
    super(props)

    this.state = {
      __metadata: [],
      __spine: [],
      __guide: [],
      bookURL: this.props.bookURL,
      opsURL: '',
      spine: [],
      guide: [],
      metadata: [],
      spineItemURL: '',
      currentSpineItem: null,
      currentSpineItemIndex: 0,
      cache: this.props.cache,

      // Layout
      hash: Asset.createHash(this.props.bookURL),
      cssHash: null,

      // Navigation
      spreadIndex: 0,
      handleEvents: false,
      firstChapter: false,
      lastChapter: false,
      firstSpread: false,
      lastSpread: false,
      delta: 0,

      // Sidebar
      showSidebar: null,

      // View
      pageAnimation: false, // Disabled by default, and activated in Reader.enablePageTransitions on user action
      spinnerVisible: true,
    }

    this.localStorageKey = 'bber_reader'
    this.debounceResizeSpeed = 400

    this.handleResizeStart = debounce(
      this.handleResizeStart,
      this.debounceResizeSpeed,
      {
        leading: true,
        trailing: false,
      }
    ).bind(this)

    this.handleResizeEnd = debounce(
      this.handleResizeEnd,
      this.debounceResizeSpeed,
      {
        leading: false,
        trailing: true,
      }
    ).bind(this)
  }

  // When the reader mounts, navigate to the desired location. The location is
  // determined by checking the following in this order:
  //
  // 1. The pathname and query string entered manually or via a link in the
  //    browser bar
  // 2. The values stored in localStorage from the last time the user loaded the
  //    book, if at ll
  // 3. If neither of the above conditions are met, then the first page of the
  //    book is loaded
  async UNSAFE_componentWillMount() {
    // Clear cache initially (for now). Still caches styles for subsequent pages
    Cache.clear()

    const storage = Storage.get(this.localStorageKey) || {}

    // Update the custom viewer settings (font size, line height, etc) for the
    // current book. Viewer settings can be exposed to the user in the future
    if (useLocalStorage !== false && storage.viewerSettings) {
      this.props.viewerSettingsActions.update(storage.viewerSettings)
    }

    // Load the spine, guide, and metadata
    await this.createStateFromOPF()

    // Check the current query string if one exists
    const params = new URLSearchParams(this.props.search) // TODO this.props or window location?
    const slug = params.get('slug')

    const { spine, hash } = this.state

    let currentSpineItemIndex = findIndex(spine, { slug })
    let currentSpineItem = spine[currentSpineItemIndex]
    let spreadIndex = 0

    if (currentSpineItem) {
      this.setState(
        { currentSpineItem, currentSpineItemIndex, spreadIndex },
        () => this.loadSpineItem(currentSpineItem)
      )

      return
    }

    // Location can't be determined from the query string. Load from location
    // in localStorage
    if (useLocalStorage !== false && storage?.[hash]?.currentSpineItem) {
      ;({ currentSpineItem, currentSpineItemIndex, spreadIndex } = storage[
        hash
      ])

      this.setState(
        { currentSpineItem, currentSpineItemIndex, spreadIndex },
        () => this.loadSpineItem(currentSpineItem)
      )

      return
    }

    // There is no entry in localStorage for the current book, load the first
    // page of the first chapter
    this.loadSpineItem()
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('resize', this.handleResizeStart)
    window.addEventListener('resize', this.handleResizeEnd)

    document.addEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      this.handleResize
    )
    document.addEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      this.handleResizeStart
    )
    document.addEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      this.handleResizeEnd
    )
  }

  componentWillUnmount() {
    const { cssHash } = this.state
    this.setState({ hash: null, cssHash: null })
    Asset.removeBookStyles(cssHash)

    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('resize', this.handleResizeStart)
    window.removeEventListener('resize', this.handleResizeEnd)

    document.removeEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      this.handleResize
    )
    document.removeEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      this.handleResizeStart
    )
    document.removeEventListener(
      'webkitfullscreenchange mozfullscreenchange fullscreenchange',
      this.handleResizeEnd
    )
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const {
      loaded: nextLoaded,
      lastSpreadIndex: nextLastSpreadIndex,
      pendingDeferredCallbacks: nextPendingDeferredCallbacks,
    } = nextProps.view

    const { hash, cssHash } = this.state
    const { search } = this.props

    // The query string has changed in that either
    // 1. There is a new slug (chapter). Load the page asynchronously and let
    //    the post-loaded callbacks update the postion
    // 2. There is a new spread index (page). Update state to initialize the
    //    page transition
    if (nextProps.search !== search) {
      const { slug, currentSpineItemIndex, spreadIndex } = Url.parseQueryString(
        nextProps.search
      )

      const prevURL = Url.parseQueryString(search)

      // Load the new spine item if the slug has changed. `loadSpineItem`
      // updates the query string, so we can return immediately after this
      // branch
      if (prevURL?.slug && slug && prevURL.slug !== slug) {
        const spineItem = find(this.state.spine, { slug })
        this.loadSpineItem(spineItem)
        return
      }

      // Update state for the new location
      this.setState({
        slug,
        currentSpineItemIndex,
        spreadIndex: Number(spreadIndex),
      })
    }

    // CSS updates
    if (hash === null || cssHash === null) {
      const state = {}
      if (hash === null) state.hash = nextProps.hash
      if (cssHash === null) state.scopedCSS = nextProps.cssHash
      this.setState(state)
    }

    // Render the view
    if (
      nextLoaded &&
      nextLastSpreadIndex !== -1 &&
      nextPendingDeferredCallbacks === true
    ) {
      this.props.requestDeferredCallbackExecution()
    }
  }

  handleResize = () => {
    const viewerSettings = new ViewerSettings()
    this.props.viewerSettingsActions.update(viewerSettings.get())
  }

  handleResizeStart = () => {
    this.props.viewActions.unload()
    this.props.viewActions.updateLastSpreadIndex(-1)
    this.disablePageTransitions()
    this.showSpinner()
  }

  handleResizeEnd = () => this.hideSpinner()

  updateQueryString = callback => {
    const { currentSpineItem, currentSpineItemIndex, spreadIndex } = this.state
    const { pathname, search } = this.props
    const { slug } = currentSpineItem
    const url = Url.parseQueryString(search)
    const updateMethod = !url.slug || url.slug === slug ? 'replace' : 'push'

    const nextSearch = Url.buildQueryString({
      slug,
      currentSpineItemIndex,
      spreadIndex,
    })

    history[updateMethod]({
      pathname,
      search: nextSearch,
      state: { bookURL: this.state.bookURL },
    })

    if (callback) callback()
  }

  showSpinner = () => this.setState({ spinnerVisible: true })

  hideSpinner = () => this.setState({ spinnerVisible: false })

  createStateFromOPF = async () => {
    const { bookURL } = this.state
    const opfURL = XMLAdaptor.opfURL(bookURL)
    const opsURL = XMLAdaptor.opsURL(bookURL)

    this.setState({ opsURL })

    let data
    let guideItems
    let spineItems

    data = await Request.get(opfURL)
    data = await XMLAdaptor.parseOPF(data)
    data = await XMLAdaptor.parseNCX(data, opsURL)
    ;[guideItems, spineItems] = await Promise.all([
      XMLAdaptor.createGuideItems(data),
      XMLAdaptor.createSpineItems(data),
    ])
    data = { ...guideItems, ...spineItems }
    ;[guideItems, spineItems] = await Promise.all([
      XMLAdaptor.udpateGuideItemURLs(data, opsURL),
      XMLAdaptor.udpateSpineItemURLs(data, opsURL),
    ])
    data = { ...guideItems, ...spineItems }
    data = await XMLAdaptor.createBookMetadata(data)

    this.setState(data)
  }

  enablePageTransitions = () => this.setState({ pageAnimation: true })

  disablePageTransitions = () => this.setState({ pageAnimation: false })

  enableEventHandling = () => this.setState({ handleEvents: true })

  disableEventHandling = () => this.setState({ handleEvents: false })

  closeSidebars = () => this.setState({ showSidebar: null })

  freeze = () => {
    this.props.viewActions.unload()
    this.props.viewActions.updateLastSpreadIndex(-1)
    this.setState({
      showSidebar: null,
      handleEvents: false,
      pageAnimation: false,
      spinnerVisible: true,
    })
  }

  // Shows content and enables UI once book content has been loaded
  showSpineItem = () => {
    const { spine, spreadIndex, currentSpineItemIndex } = this.state
    const { lastSpreadIndex } = this.props.view

    const firstChapter = currentSpineItemIndex === 0
    const lastChapter = currentSpineItemIndex === spine.length - 1
    const firstSpread = spreadIndex === 0
    const lastSpread = spreadIndex === lastSpreadIndex

    this.setState(
      { firstChapter, lastChapter, firstSpread, lastSpread },
      () => {
        this.savePosition()
        this.enableEventHandling()
        this.hideSpinner()

        Messenger.sendPaginationEvent(this.state)
      }
    )
  }

  // Makes requests to load book content
  loadSpineItem = async (spineItem, deferredCallback) => {
    let { hash, cssHash } = this.state
    let requestedSpineItem = spineItem
    if (!requestedSpineItem) [requestedSpineItem] = this.state.spine

    this.freeze()

    let content

    try {
      const { data, request } = await Request.get(
        requestedSpineItem.absoluteURL
      )
      content = await XMLAdaptor.parseSpineItemResponse({
        data,
        request,
        requestedSpineItem,
        ...this.state,
        paddingLeft: this.props.viewerSettings.paddingLeft,
        columnGap: this.props.viewerSettings.columnGap,
      })
    } catch (err) {
      // Something went wrong loading the book. Clear storage for this book

      // TODO retry? try to navigate to home?
      // @issue: https://github.com/triplecanopy/b-ber/issues/214
      console.error(err)

      const storage = Storage.get(this.localStorageKey) || {}
      ;({ hash } = this.state)

      delete storage[hash]
      Storage.set(this.localStorageKey, storage)

      return
    }

    const { bookContent, scopedCSS } = content

    book.content = bookContent

    if (cssHash === null) {
      cssHash = hash
      Asset.appendBookStyles(scopedCSS, hash)
    }

    this.setState(
      {
        cssHash,
        currentSpineItem: requestedSpineItem,
        spineItemURL: requestedSpineItem.absoluteURL,
      },
      () =>
        // Update the query string to trigger a page transition and call the
        // deferredCallback if one is set, or `showSpineItem` if not
        this.updateQueryString(() =>
          this.props.registerDeferredCallback(
            deferredCallback || this.showSpineItem
          )
        )
    )
  }

  handleSidebarButtonClick = value => {
    let { showSidebar } = this.state
    showSidebar = value === showSidebar ? null : value
    this.setState({ showSidebar })
  }

  handlePageNavigation = increment => {
    let { spreadIndex } = this.state

    const { lastSpreadIndex } = this.props.view
    const nextIndex = spreadIndex + increment

    if (nextIndex > lastSpreadIndex || nextIndex < 0) {
      // Move to next or prev chapter
      const sign = Math.sign(increment)
      this.handleChapterNavigation(sign)
      return
    }

    const firstSpread = nextIndex === 0
    const lastSpread = nextIndex === lastSpreadIndex
    const spreadDelta = nextIndex > spreadIndex ? 1 : -1
    spreadIndex = nextIndex

    this.setState(
      { spreadIndex, firstSpread, lastSpread, spreadDelta, showSidebar: null },
      () => {
        this.updateQueryString()
        Messenger.sendPaginationEvent(this.state)
      }
    )
  }

  handleChapterNavigation = increment => {
    let { currentSpineItemIndex } = this.state
    const { spine } = this.state
    const nextIndex = Number(currentSpineItemIndex) + increment
    const firstChapter = nextIndex < 0
    let lastChapter = nextIndex > spine.length - 1

    if (firstChapter || lastChapter) {
      this.setState({ firstChapter, lastChapter }, () =>
        Messenger.sendPaginationEvent(this.state)
      )
      return
    }

    currentSpineItemIndex = nextIndex

    const currentSpineItem = spine[nextIndex]
    const spreadIndex = 0

    let deferredCallback = direction => () => {
      const { lastSpreadIndex } = this.props.view
      const firstSpread = spreadIndex === 0
      const lastSpread = spreadIndex === lastSpreadIndex
      const spreadDelta = direction

      lastChapter = currentSpineItemIndex === spine.length - 1

      this.setState(
        {
          firstChapter,
          lastChapter,
          firstSpread,
          lastSpread,
          spreadDelta,
        },
        () => {
          if (direction === -1) {
            this.navigateToSpreadByIndex(lastSpreadIndex)
          }

          this.enableEventHandling()
          this.hideSpinner()

          Messenger.sendPaginationEvent(this.state)
        }
      )
    }

    deferredCallback = deferredCallback(increment)

    this.setState(
      {
        spreadIndex,
        currentSpineItem,
        currentSpineItemIndex,
        showSidebar: null,
        firstChapter,
        lastChapter,
      },
      () => {
        this.loadSpineItem(currentSpineItem, deferredCallback)
        this.savePosition()
      }
    )
  }

  navigateToSpreadByIndex = spreadIndex => {
    this.setState({ spreadIndex }, this.updateQueryString)
  }

  navigateToElementById = hash => {
    // Get the element to which the page will scroll in the layout
    const elem = document.querySelector(hash)

    if (!elem) return console.warn(`Could not find element ${hash}`)

    // Scroll to vertical position, leave a bit of room for the controls and
    // whitespace around the element
    if (Viewport.isMobile()) {
      const padding = 25
      const offset =
        document.querySelector('.controls__header').offsetHeight + padding
      const top = elem.offsetTop - offset

      document.getElementById('frame').scrollTo(0, top) // TODO should be handled in Frame.jsx
    }

    const { paddingTop, paddingBottom, columnGap } = this.props.viewerSettings

    // Calculate the frameHeight using the same method in Layout.jsx, by
    // rounding the window height minus the padding top and bottom of the
    // reader's frame
    const height = window.innerHeight
    const frameHeight = Math.round(height - paddingTop - paddingBottom)

    // Find the index of the spread that our element appears on by getting
    // it's left-most value (accounting for the gutter), and dividing it by
    // the height of a single column
    const left = elem.offsetLeft - columnGap
    const spreadIndex = Math.floor(left / frameHeight / 2)

    // Move to the desired spread when the query string actually updates
    this.setState({ spreadIndex }, this.updateQueryString)
  }

  navigateToChapterByURL = absoluteURL => {
    const { spine } = this.state
    const url = new window.URL(absoluteURL)

    // Can eventually handle hashes or query strings here
    const nextAbsolutURL = `${url.origin}${url.pathname}`

    let deferredCallback
    const { hash } = url

    if (hash) {
      deferredCallback = () => {
        this.navigateToElementById(hash)
        this.enableEventHandling()
        this.hideSpinner()
      }
    }

    const currentSpineItemIndex = findIndex(spine, {
      absoluteURL: nextAbsolutURL,
    })

    if (currentSpineItemIndex === this.state.currentSpineItemIndex) {
      return this.closeSidebars()
    }

    if (currentSpineItemIndex < 0) {
      console.warn(`No spine item found for ${nextAbsolutURL}`)
      return
    }

    const currentSpineItem = spine[currentSpineItemIndex]
    const spreadIndex = 0
    const pageAnimation = false

    this.setState(
      {
        currentSpineItem,
        currentSpineItemIndex,
        spreadIndex,
        pageAnimation,
      },
      () => {
        this.loadSpineItem(currentSpineItem, deferredCallback)
        this.savePosition()
      }
    )
  }

  getTranslateX = _spreadIndex => {
    const spreadIndex = unlessDefined(_spreadIndex, this.state.spreadIndex)

    const {
      width,
      paddingLeft,
      paddingRight,
      columnGap,
    } = this.props.viewerSettings

    const isMobile = Viewport.isMobile()

    let translateX = 0
    if (!isMobile) {
      translateX =
        (width - paddingLeft - paddingRight + columnGap) * spreadIndex * -1

      // no -0
      translateX =
        translateX === 0 && Math.sign(1 / translateX) === -1 ? 0 : translateX
    }

    return translateX
  }

  savePosition = () => {
    if (useLocalStorage === false) return

    const {
      hash,
      currentSpineItem,
      currentSpineItemIndex,
      spreadIndex,
    } = this.state

    const storage = Storage.get(this.localStorageKey) || {}
    storage[hash] = { currentSpineItem, currentSpineItemIndex, spreadIndex }

    Storage.set(this.localStorageKey, storage)
  }

  // TODO the location.state.bookURL prop is how we're signal to the reader that
  // there is a book loaded, but that the pathname is '/'. Would be good to have
  // this standardized
  destroyReaderComponent = () => history.push('/', { bookURL: '' })

  render() {
    const { lastSpreadIndex } = this.props.view

    const {
      metadata,
      guide,
      spine,
      currentSpineItemIndex,
      showSidebar,
      hash,
      bookURL,
      lastSpread,
      spreadIndex,
      pageAnimation,
      handleEvents,
      spinnerVisible,
    } = this.state

    let slug = ''

    if (
      spine &&
      isInteger(currentSpineItemIndex) &&
      spine[currentSpineItemIndex]
    ) {
      ;({ slug } = spine[currentSpineItemIndex])
    }

    return (
      <Controls
        guide={guide}
        spine={spine}
        currentSpineItemIndex={currentSpineItemIndex}
        metadata={metadata}
        showSidebar={showSidebar}
        handleEvents={handleEvents}
        spreadIndex={spreadIndex}
        lastSpreadIndex={lastSpreadIndex}
        enablePageTransitions={this.enablePageTransitions}
        handlePageNavigation={this.handlePageNavigation}
        destroyReaderComponent={this.destroyReaderComponent}
        handleChapterNavigation={this.handleChapterNavigation}
        handleSidebarButtonClick={this.handleSidebarButtonClick}
        navigateToChapterByURL={this.navigateToChapterByURL}
        downloads={this.props.downloads}
        uiOptions={this.props.uiOptions}
        viewerSettings={this.props.viewerSettings}
        update={this.props.viewerSettingsActions.update}
        save={this.props.viewerSettingsActions.save}
      >
        <ReaderContext.Provider
          value={{
            lastSpread,
            spreadIndex,
            getTranslateX: this.getTranslateX,
            navigateToChapterByURL: this.navigateToChapterByURL,
          }}
        >
          <Frame
            slug={slug}
            hash={hash}
            bookURL={bookURL}
            spreadIndex={spreadIndex}
            lastSpreadIndex={lastSpreadIndex}
            BookContent={BookContent}
            pageAnimation={pageAnimation}
            viewerSettings={this.props.viewerSettings}
            update={this.props.viewerSettingsActions.update}
            // Can't wrap layout or the withObservable HOC in a way that preserves
            // refs, so pass down `view` as props
            view={this.props.view}
          />
        </ReaderContext.Provider>
        <Spinner spinnerVisible={spinnerVisible} />
      </Controls>
    )
  }
}

const mapStateToProps = ({ readerSettings, viewerSettings, view }) => ({
  readerSettings,
  viewerSettings,
  view,
})

const mapDispatchToProps = dispatch => ({
  viewerSettingsActions: bindActionCreators(viewerSettingsActions, dispatch),
  viewActions: bindActionCreators(viewActions, dispatch),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withDeferredCallbacks(Reader))
