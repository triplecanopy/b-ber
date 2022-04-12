import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import findIndex from 'lodash/findIndex'
import debounce from 'lodash/debounce'
import find from 'lodash/find'
import isInteger from 'lodash/isInteger'
import { Controls, Frame, Spinner } from '.'
import Request from '../helpers/Request'
import XMLAdaptor from '../helpers/XMLAdaptor'
import Asset from '../helpers/Asset'
import Url from '../helpers/Url'
import Storage from '../helpers/Storage'
import withDeferredCallbacks from '../lib/with-deferred-callbacks'
import ReaderContext from '../lib/reader-context'
import Messenger from '../lib/Messenger'
import Viewport from '../helpers/Viewport'
import { ViewerSettings } from '../models'
import { unlessDefined } from '../helpers/utils'
import * as viewActions from '../actions/view'
import * as viewerSettingsActions from '../actions/viewer-settings'
import * as readerSettingsActions from '../actions/reader-settings'
import * as readerLocationActions from '../actions/reader-location'
import { layouts } from '../constants'

const book = { content: null }

function BookContent() {
  return <div key="book-content">{book.content}</div>
}

class Reader extends Component {
  constructor(props) {
    super(props)

    this.state = {
      __metadata: [],
      __spine: [],
      __guide: [],

      opsURL: '',
      spine: [],
      guide: [],
      metadata: [],
      spineItemURL: '',
      currentSpineItem: null,
      currentSpineItemIndex: 0,
      cache: this.props.cache,

      // Layout
      disableMobileResizeEvents: 'ontouchstart' in document.documentElement,

      // Navigation
      // Current spread index
      spreadIndex: 0,

      // Used to calculate next spread position after resize to keep
      // the user at/close to the previous reading position
      relativeSpreadPosition: 0.0,

      handleEvents: false,
      firstChapter: false,
      lastChapter: false,
      firstSpread: false,
      lastSpread: false,
      delta: 0,

      // Sidebar
      showSidebar: null,

      // View
      // Disabled by default, and activated in Reader.enablePageTransitions on user action
      pageAnimation: false,
      spinnerVisible: true,
    }

    this.debounceResizeSpeed = 400
    this.resizeEndTimer = null

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

  async UNSAFE_componentWillMount() {
    // Load the spine, guide, and metadata
    await this.createStateFromOPF()

    const { spine } = this.state
    const { readerSettings, readerLocation } = this.props

    // Check the current query string if one exists
    const params = new URLSearchParams(readerLocation.searchParams)
    const currentSpineItemIndex = params.get(
      readerSettings.searchParamKeys.currentSpineItemIndex
    )
    const currentSpineItem = spine[currentSpineItemIndex]
    const spreadIndex = 0

    if (currentSpineItem) {
      this.setState(
        { currentSpineItem, currentSpineItemIndex, spreadIndex },
        () => this.loadSpineItem(currentSpineItem)
      )

      return
    }

    // Fallback to load the first page of the first chapter
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

    // Disable mobile zoom - check to see how many fingers are on the screen
    // document.addEventListener(
    //   'touchstart',
    //   e => {
    //     if (e.touches.length > 1) {
    //       e.preventDefault()
    //     }
    //   },
    //   { passive: false, capture: false }
    // )

    // Disable tap-to-zoom - prevent events on everything except buttons, links, etc
    // const interactiveElements = new Set(['A', 'INPUT', 'BUTTON'])
    // document.addEventListener(
    //   'touchend',
    //   e => {
    //     if (!interactiveElements.has(e.target.nodeName)) {
    //       e.preventDefault()
    //     }
    //   },
    //   {
    //     passive: false,
    //     capture: false,
    //   }
    // )
  }

  componentWillUnmount() {
    const hash = Asset.createHash(this.props.readerSettings.bookURL)

    Asset.removeBookStyles(hash)

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

    const { searchParams: prevSearchParams } = this.props.readerLocation
    const { searchParams: nextSearchParams } = nextProps.readerLocation

    // The query string has changed in that either
    // 1. There is a new slug (chapter). Load the page asynchronously and let
    //    the post-loaded callbacks update the postion
    // 2. There is a new spread index (page). Update state to initialize the
    //    page transition
    if (nextSearchParams !== prevSearchParams) {
      const nextParams = Url.parseQueryString(nextSearchParams)

      const slug = nextParams[this.props.readerSettings.searchParamKeys.slug]
      const currentSpineItemIndex =
        nextParams[
          this.props.readerSettings.searchParamKeys.currentSpineItemIndex
        ]
      const spreadIndex =
        nextParams[this.props.readerSettings.searchParamKeys.spreadIndex]

      const prevParams = Url.parseQueryString(prevSearchParams)
      const prevSlug =
        prevParams[this.props.readerSettings.searchParamKeys.slug]

      // Load the new spine item if the slug has changed. `loadSpineItem`
      // updates the query string, so we can return immediately after this
      // branch
      if (prevSlug && slug && prevSlug !== slug) {
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
    if (this.state.disableMobileResizeEvents) return

    const viewerSettings = new ViewerSettings()
    this.props.viewerSettingsActions.update(viewerSettings.get())
  }

  handleResizeStart = () => {
    if (this.state.disableMobileResizeEvents) return

    const { spreadIndex } = this.state
    const { lastSpreadIndex } = this.props.view

    let relativeSpreadPosition = 0
    if (spreadIndex > 0 && lastSpreadIndex > 0) {
      relativeSpreadPosition = spreadIndex / lastSpreadIndex
    }

    // Save the relative position (float) to calculate next position
    // after resize
    this.setState({ relativeSpreadPosition }, () => {
      this.props.viewActions.unload()
      this.props.viewActions.updateLastSpreadIndex(-1)
      this.disablePageTransitions()

      this.showSpinner()
    })
  }

  handleResizeEnd = () => {
    if (this.state.disableMobileResizeEvents) return

    // Adjust users position so that they're on/close to the page
    // before resize
    const { spreadIndex, relativeSpreadPosition } = this.state
    const { lastSpreadIndex } = this.props.view

    // Could stackoverflow here if lastSpreadIndex stays at -1,
    // but `updateLastSpreadIndex` eventually sets lastSpreadIndex
    // to something reasonable
    if (lastSpreadIndex < 0) {
      window.clearTimeout(this.resizeEndTimer)
      this.resizeEndTimer = setTimeout(() => this.handleResizeEnd(), 200)
      return
    }

    let nextSpreadIndex = spreadIndex * relativeSpreadPosition

    // No negative
    nextSpreadIndex = nextSpreadIndex < 1 ? 0 : nextSpreadIndex

    // Round to closest position
    // Bit of heuristics here, this seems to work relatively well
    nextSpreadIndex = Math.ceil(nextSpreadIndex) + 2

    // Not greater than last spread index
    nextSpreadIndex =
      nextSpreadIndex > lastSpreadIndex ? lastSpreadIndex : nextSpreadIndex

    this.navigateToSpreadByIndex(nextSpreadIndex)

    this.hideSpinner()
  }

  updateQueryString = callback => {
    const { spreadIndex, currentSpineItem, currentSpineItemIndex } = this.state
    const { slug } = currentSpineItem
    const { searchParams } = this.props.readerLocation
    const nextSearchParams = new window.URLSearchParams(searchParams)

    nextSearchParams.set(
      Url.queryStringKey(this.props.readerSettings.searchParamKeys.slug),
      Url.queryStringValue(slug)
    )
    nextSearchParams.set(
      Url.queryStringKey(
        this.props.readerSettings.searchParamKeys.currentSpineItemIndex
      ),
      Url.queryStringValue(currentSpineItemIndex)
    )
    nextSearchParams.set(
      Url.queryStringKey(this.props.readerSettings.searchParamKeys.spreadIndex),
      Url.queryStringValue(spreadIndex)
    )

    const nextLocation = { searchParams: nextSearchParams.toString() }

    this.props.readerLocationActions.updateLocation(nextLocation)

    if (callback) callback()
  }

  showSpinner = () => this.setState({ spinnerVisible: true })

  hideSpinner = () => this.setState({ spinnerVisible: false })

  createStateFromOPF = async () => {
    const { bookURL } = this.props.readerSettings

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

  // disableEventHandling = () => this.setState({ handleEvents: false })

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
    const hash = Asset.createHash(this.props.readerSettings.bookURL)

    let requestedSpineItem = spineItem
    if (!requestedSpineItem) [requestedSpineItem] = this.state.spine

    this.freeze()

    let content

    try {
      const { cache, opsURL } = this.state
      const { data, request } = await Request.get(
        requestedSpineItem.absoluteURL
      )

      content = await XMLAdaptor.parseSpineItemResponse({
        data,
        hash,
        cache,
        opsURL,
        request,
        requestedSpineItem,
        paddingLeft: this.props.viewerSettings.paddingLeft,
        columnGap: this.props.viewerSettings.columnGap,
      })
    } catch (err) {
      // Something went wrong loading the book. Clear storage for this book

      // TODO retry? try to navigate to home?
      // @issue: https://github.com/triplecanopy/b-ber/issues/214
      console.error(err)

      const storage = Storage.get() || {}

      delete storage[hash]
      Storage.set(storage)

      return
    }

    const { bookContent, scopedCSS } = content

    book.content = bookContent

    Asset.appendBookStyles(scopedCSS, hash)

    this.setState(
      {
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

  navigateToElementById = id => {
    // Get the element to which the page will scroll in the layout
    const elem = document.querySelector(id)

    if (!elem) return console.warn(`Could not find element ${id}`)

    // Scroll to vertical position, leave a bit of room for the controls and
    // whitespace around the element
    const { layout } = this.props.readerSettings
    if (layout === layouts.SCROLL || Viewport.isMobile()) {
      const padding = 25
      const offset =
        document.querySelector('.bber-controls__header').offsetHeight + padding
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
    const { hash: id } = url

    if (id) {
      deferredCallback = () => {
        this.navigateToElementById(id)
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

    const { layout } = this.props.readerSettings

    const isScrolling = layout === layouts.SCROLL || Viewport.isMobile()

    let translateX = 0
    if (!isScrolling) {
      translateX =
        (width - paddingLeft - paddingRight + columnGap) * spreadIndex * -1

      // no -0
      translateX =
        translateX === 0 && Math.sign(1 / translateX) === -1 ? 0 : translateX
    }

    return translateX
  }

  savePosition = () => {
    const { currentSpineItemIndex, spreadIndex } = this.state
    const { searchParamKeys } = this.props.readerSettings

    const params = new URLSearchParams()

    params.set(searchParamKeys.currentSpineItemIndex, currentSpineItemIndex)
    params.set(searchParamKeys.spreadIndex, spreadIndex)

    const location = { searchParams: params.toString() }

    this.props.readerLocationActions.updateLocalStorage(location)
  }

  // TODO the location.state.bookURL prop is how we're signal to the reader that
  // there is a book loaded, but that the pathname is '/'. Would be good to have
  // this standardized
  destroyReaderComponent = () => {
    this.props.readerSettingsActions.updateSettings({ bookURL: '' })
    // history.push('/')
  }

  render() {
    const { downloads, uiOptions, viewerSettings, view, layout } = this.props
    const { lastSpreadIndex } = view

    const {
      metadata,
      guide,
      spine,
      currentSpineItemIndex,
      showSidebar,
      lastSpread,
      spreadIndex,
      pageAnimation,
      handleEvents,
      spinnerVisible,
    } = this.state

    const { bookURL } = this.props.readerSettings

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
        downloads={downloads}
        uiOptions={uiOptions}
        viewerSettings={viewerSettings}
        layout={layout}
        update={this.props.viewerSettingsActions.update}
        save={this.props.viewerSettingsActions.save}
      >
        <ReaderContext.Provider
          // eslint-disable-next-line react/jsx-no-constructed-context-values
          value={{
            lastSpread,
            spreadIndex,
            getTranslateX: this.getTranslateX,
            navigateToChapterByURL: this.navigateToChapterByURL,
          }}
        >
          <Frame
            slug={slug}
            bookURL={bookURL}
            spreadIndex={spreadIndex}
            lastSpreadIndex={lastSpreadIndex}
            BookContent={BookContent}
            pageAnimation={pageAnimation}
            layout={layout}
            viewerSettings={this.props.viewerSettings}
            update={this.props.viewerSettingsActions.update}
            // Can't wrap layout or the withObservable HOC in a way that preserves
            // refs, so pass down `view` as props
            view={view}
            style={this.props.style}
            className={this.props.className}
          />
        </ReaderContext.Provider>
        <Spinner spinnerVisible={spinnerVisible} />
      </Controls>
    )
  }
}

const mapStateToProps = ({
  readerSettings,
  viewerSettings,
  readerLocation,
  view,
}) => ({
  readerSettings,
  viewerSettings,
  readerLocation,
  view,
})

const mapDispatchToProps = dispatch => ({
  viewerSettingsActions: bindActionCreators(viewerSettingsActions, dispatch),
  readerSettingsActions: bindActionCreators(readerSettingsActions, dispatch),
  readerLocationActions: bindActionCreators(readerLocationActions, dispatch),
  viewActions: bindActionCreators(viewActions, dispatch),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withDeferredCallbacks(Reader))
