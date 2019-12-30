import React, { Component } from 'react'
import PropTypes from 'prop-types'
import findIndex from 'lodash/findIndex'
import debounce from 'lodash/debounce'
import find from 'lodash/find'
import { Controls, Frame, Spinner } from '.'
import { Request, XMLAdaptor, Asset, Url, Cache, Storage } from '../helpers'
import { ViewerSettings } from '../models'
import { debug, verboseOutput, logTime, useLocalStorage } from '../config'
import history from '../lib/History'
import withDeferredCallbacks from '../lib/with-deferred-callbacks'
import Messenger from '../lib/Messenger'
import Viewport from '../helpers/Viewport'

// const debug = true
// const verboseOutput = true
const MAX_RENDER_TIMEOUT = 0
const MAX_DEFERRED_CALLBACK_TIMEOUT = 0

const book = { content: null }

const BookContent = () => <div>{book.content}</div>

class Reader extends Component {
  static childContextTypes = {
    viewerSettings: PropTypes.object,
    spreadIndex: PropTypes.number,
    overlayElementId: PropTypes.string,
    navigateToChapterByURL: PropTypes.func,
    registerOverlayElementId: PropTypes.func,
    deRegisterOverlayElementId: PropTypes.func,
    requestDeferredCallbackExecution: PropTypes.func,
    addRef: PropTypes.func,
    refs: PropTypes.object,
    viewLoaded: PropTypes.bool,
    lastSpread: PropTypes.bool,
  }
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
      search: '',
      cache: this.props.cache,

      // layout
      hash: Asset.createHash(this.props.bookURL),
      cssHash: null,

      // navigation
      spreadIndex: 0,
      lastSpreadIndex: 0,
      handleEvents: false,
      firstChapter: false,
      lastChapter: false,
      firstSpread: false,
      lastSpread: false,
      delta: 0,

      // sidebar
      showSidebar: null,

      // view
      viewerSettings: new ViewerSettings(),
      pageAnimation: false, // disabled by default, and activated in Reader#enablePageTransitions on user action
      overlayElementId: null,
      spinnerVisible: true,
      viewLoaded: false,

      refs: {},
    }

    this.localStorageKey = 'bber_reader'

    this.createStateFromOPF = this.createStateFromOPF.bind(this)
    this.loadSpineItem = this.loadSpineItem.bind(this)
    this.savePosition = this.savePosition.bind(this)
    this.updateViewerSettings = this.updateViewerSettings.bind(this)
    this.loadInitialSpineItem = this.loadInitialSpineItem.bind(this)

    this._setState = this._setState.bind(this)
    this.handleSidebarButtonClick = this.handleSidebarButtonClick.bind(this)
    this.handleChapterNavigation = this.handleChapterNavigation.bind(this)
    this.handlePageNavigation = this.handlePageNavigation.bind(this)
    this.navigateToChapterByURL = this.navigateToChapterByURL.bind(this)
    this.navigateToElementById = this.navigateToElementById.bind(this)
    this.destroyReaderComponent = this.destroyReaderComponent.bind(this)
    this.enablePageTransitions = this.enablePageTransitions.bind(this)
    this.disablePageTransitions = this.disablePageTransitions.bind(this)
    this.enableEventHandling = this.enableEventHandling.bind(this)
    this.disableEventHandling = this.disableEventHandling.bind(this)
    this.closeSidebars = this.closeSidebars.bind(this)
    this.updateQueryString = this.updateQueryString.bind(this)
    this.saveViewerSettings = this.saveViewerSettings.bind(this)
    this.registerOverlayElementId = this.registerOverlayElementId.bind(this)
    this.deRegisterOverlayElementId = this.deRegisterOverlayElementId.bind(this)
    this.showSpinner = this.showSpinner.bind(this)
    this.hideSpinner = this.hideSpinner.bind(this)

    this.handleResize = this.handleResize.bind(this)

    this.handleScriptCreate = this.handleScriptCreate.bind(this)
    this.handleScriptError = this.handleScriptError.bind(this)
    this.handleScriptLoad = this.handleScriptLoad.bind(this)

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

  addRef = ref => {
    const { refs } = this.state
    const nextRefs = { ...refs, [ref.markerId]: ref }
    this.setState({ refs: nextRefs })
  }

  getChildContext() {
    return {
      viewerSettings: this.state.viewerSettings,
      addRef: this.addRef.bind(this),
      refs: this.state.refs,
      spreadIndex: this.state.spreadIndex,
      navigateToChapterByURL: this.navigateToChapterByURL,
      overlayElementId: this.state.overlayElementId,
      registerOverlayElementId: this.registerOverlayElementId,
      deRegisterOverlayElementId: this.deRegisterOverlayElementId,
      requestDeferredCallbackExecution: this.props
        .requestDeferredCallbackExecution,
      viewLoaded: this.state.viewLoaded,
      lastSpread: this.state.lastSpread,
    }
  }

  componentWillMount() {
    Cache.clear() // clear initially for now. still caches styles for subsequent pages

    this.createStateFromOPF().then(() => {
      if (useLocalStorage === false) return this.loadSpineItem()

      const storage = Storage.get(this.localStorageKey)

      if (storage.viewerSettings) {
        this.updateViewerSettings(storage.viewerSettings)
      }

      this.loadInitialSpineItem(storage)
    })
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('resize', this.handleResizeStarthandleResize)
    window.addEventListener('resize', this.handleResizeEndhandleResize)
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

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { hash, cssHash, search } = this.state

    if (nextProps.search !== search) {
      const { slug, currentSpineItemIndex, spreadIndex } = Url.parseQueryString(
        nextProps.search
      )
      const url = Url.parseQueryString(search)

      // load the new spine item if the slug has changed
      if (url.slug && url.slug !== slug) {
        const spineItem = find(this.state.spine, { slug })
        return this.loadSpineItem(spineItem)
      }

      // otherwise update the query string
      const spreadIndex_ = Number(spreadIndex)
      this.setState({
        slug,
        currentSpineItemIndex,
        spreadIndex: spreadIndex_,
        search: nextProps.search,
      })
    }

    if (hash === null) {
      this.setState({ hash: nextProps.hash })
    }

    if (cssHash === null) {
      this.setState({ scopedCSS: nextProps.cssHash })
    }
  }

  shouldComponentUpdate(_, nextState) {
    const { ready } = nextState

    if (ready && ready !== this.state.ready) {
      if (debug && verboseOutput) {
        console.log(
          'Reader#shouldComponentUpdate: requestDeferredCallbackExecution',
          `ready: ${ready}`
        )
      }

      this.props.requestDeferredCallbackExecution()
    }

    return true
  }

  componentWillUnmount() {
    const { cssHash } = this.state
    this.setState({ hash: null, cssHash: null })
    Asset.removeBookStyles(cssHash)
  }

  handleResize() {
    const viewerSettings = new ViewerSettings()
    this.setState({ viewerSettings })
  }

  handleResizeStart() {
    this.disablePageTransitions()
    if (!debug) this.showSpinner()
  }

  handleResizeEnd() {
    if (!debug) this.hideSpinner()
  }

  // eslint-disable-next-line class-methods-use-this
  scrollToTop() {
    if (Viewport.isMobile()) document.getElementById('frame').scrollTo(0, 0)
  }

  updateQueryString() {
    const { currentSpineItem, currentSpineItemIndex, spreadIndex } = this.state

    const { slug } = currentSpineItem
    const url = Url.parseQueryString(this.props.search)
    const { pathname, state } = history.location
    const update = !url.slug || url.slug === slug ? 'replace' : 'push'

    const search = Url.buildQueryString({
      slug,
      currentSpineItemIndex,
      spreadIndex,
    })

    if (this.props.useBrowserHistory) {
      this.setState({ search }, () =>
        history[update]({
          pathname,
          search,
          state,
        })
      )
    } else {
      this.setState({ search }, () => history.push({ search }))
    }
  }

  showSpinner() {
    this.setState({ spinnerVisible: true, viewLoaded: false })
  }

  hideSpinner() {
    this.setState({ spinnerVisible: false, viewLoaded: true })
  }

  updateViewerSettings(settings = {}) {
    if (useLocalStorage === false || this.state.cache === false) return

    const viewerSettings = new ViewerSettings()
    viewerSettings.put(settings)
    this.setState({ viewerSettings }, this.saveViewerSettings)
  }

  // currently viewer settings are global (for all books) although they could
  // be scoped to individual books using the books' hash
  saveViewerSettings() {
    if (useLocalStorage === false || this.state.cache === false) return

    const viewerSettings = { ...this.state.viewerSettings.settings }
    const storage = Storage.get(this.localStorageKey)

    if (!storage.viewerSettings) {
      storage.viewerSettings = {}
    }

    storage.viewerSettings = {
      ...storage.viewerSettings,
      ...viewerSettings,
    }

    Storage.set(this.localStorageKey, storage)
  }

  loadInitialSpineItem(storage = {}) {
    const { hash } = this.state
    if (!storage[hash] || !storage[hash].currentSpineItem) {
      return this.loadSpineItem()
    }

    const { currentSpineItem, currentSpineItemIndex, spreadIndex } = storage[
      hash
    ]

    this.setState(
      { currentSpineItem, currentSpineItemIndex, spreadIndex },
      () => {
        this.loadSpineItem(currentSpineItem)
      }
    )
  }

  createStateFromOPF() {
    const { bookURL } = this.state
    const opfURL = XMLAdaptor.opfURL(bookURL)
    const opsURL = XMLAdaptor.opsURL(bookURL)

    this.setState({ opsURL })

    if (logTime) {
      console.time('Reader#createStateFromOPF')
      console.time('Request.get(opfURL)')
    }

    return Request.get(opfURL)
      .then(data => {
        if (logTime) {
          console.timeEnd('Request.get(opfURL)')
          console.time('XMLAdaptor.parseOPF()')
        }

        return XMLAdaptor.parseOPF(data)
      })
      .then(data => {
        if (logTime) {
          console.timeEnd('XMLAdaptor.parseOPF()')
          console.time('XMLAdaptor.parseNCX(data, opsURL)')
        }
        return XMLAdaptor.parseNCX(data, opsURL)
      })
      .then(data => {
        if (logTime) {
          console.timeEnd('XMLAdaptor.parseNCX(data, opsURL)')
          console.time(
            'XMLAdaptor.createGuideItems(data),XMLAdaptor.createSpineItems(data)'
          )
        }
        return Promise.all([
          XMLAdaptor.createGuideItems(data),
          XMLAdaptor.createSpineItems(data),
        ])
      })
      .then(([a, b]) => {
        if (logTime) {
          console.timeEnd(
            'XMLAdaptor.createGuideItems(data),XMLAdaptor.createSpineItems(data)'
          )
          console.time(
            'XMLAdaptor.udpateGuideItemURLs(data, opsURL),XMLAdaptor.udpateSpineItemURLs(data, opsURL)'
          )
        }
        const data = { ...a, ...b }
        return Promise.all([
          XMLAdaptor.udpateGuideItemURLs(data, opsURL),
          XMLAdaptor.udpateSpineItemURLs(data, opsURL),
        ])
      })
      .then(([a, b]) => {
        if (logTime) {
          console.timeEnd(
            'XMLAdaptor.udpateGuideItemURLs(data, opsURL),XMLAdaptor.udpateSpineItemURLs(data, opsURL)'
          )
        }
        return XMLAdaptor.createBookMetadata({ ...a, ...b })
      })
      .then(data => {
        if (logTime) console.timeEnd('Reader#createStateFromOPF')
        return this.setState({ ...data })
      })
      .catch(console.error)
  }

  enablePageTransitions() {
    this.setState({ pageAnimation: true })
  }
  disablePageTransitions() {
    this.setState({ pageAnimation: false })
  }
  enableEventHandling() {
    this.setState({ handleEvents: true })
  }
  disableEventHandling() {
    this.setState({ handleEvents: false })
  }
  closeSidebars() {
    this.setState({ showSidebar: null })
  }

  loadSpineItem(spineItem, deferredCallback) {
    let requestedSpineItem = spineItem
    if (!requestedSpineItem) [requestedSpineItem] = this.state.spine

    this.setState({ ready: false })
    this.closeSidebars()
    this.disableEventHandling()
    this.disablePageTransitions()
    this.showSpinner()

    if (logTime) {
      console.time('Content Visible')
      console.time('Reader#loadSpineItem')
      console.time('Request.get(requestedSpineItem.absoluteURL)')
    }

    Request.get(requestedSpineItem.absoluteURL)
      // basically we're passing in props to a dehydrated tree here.
      // should be cleaned up a bit
      .then(response => {
        if (logTime) {
          console.timeEnd('Request.get(requestedSpineItem.absoluteURL)')
          console.time('XMLAdaptor.parseSpineItemResponse()')
        }

        return XMLAdaptor.parseSpineItemResponse({
          data: response.data,
          request: response.request,
          requestedSpineItem,
          ...this.state,
          navigateToChapterByURL: this.navigateToChapterByURL,
          paddingLeft: this.state.viewerSettings.paddingLeft,
          columnGap: this.state.viewerSettings.columnGap,
        })
      })

      .then(({ bookContent, scopedCSS }) => {
        if (logTime) {
          console.timeEnd('XMLAdaptor.parseSpineItemResponse()')
        }

        const { hash } = this.state
        let { cssHash } = this.state

        book.content = bookContent

        if (cssHash === null) {
          cssHash = hash
          Asset.appendBookStyles(scopedCSS, hash)
        }

        this.setState({ cssHash })
      })
      .then(() => {
        this.setState(
          {
            currentSpineItem: requestedSpineItem,
            spineItemURL: requestedSpineItem.absoluteURL,
          },
          () => {
            this.updateQueryString()

            if (deferredCallback) {
              this.props.registerDeferredCallback(deferredCallback)
            } else {
              this.props.registerDeferredCallback(() => {
                const {
                  spine,
                  spreadIndex,
                  currentSpineItemIndex,
                  lastSpreadIndex,
                } = this.state
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
              })
            }

            return setTimeout(() => {
              if (logTime) {
                console.timeEnd('Reader#loadSpineItem')
              }
              // return this.setState({ready: true}) // TODO: force load
              // @issue: https://github.com/triplecanopy/b-ber/issues/214
            }, MAX_RENDER_TIMEOUT)
          }
        )
      })
      .catch(err => {
        // Something went wrong loading the book. clear storage for this book
        // TODO: retry? try to navigate to home
        // @issue: https://github.com/triplecanopy/b-ber/issues/214

        console.error(err)

        const storage = Storage.get(this.localStorageKey)
        const { hash } = this.state
        delete storage[hash]

        Storage.set(this.localStorageKey, storage)
      })
  }

  handleSidebarButtonClick(value) {
    let { showSidebar } = this.state
    showSidebar = value === showSidebar ? null : value
    this.setState({ showSidebar })
  }

  handlePageNavigation(increment) {
    let { spreadIndex } = this.state
    const { lastSpreadIndex } = this.state
    const nextIndex = spreadIndex + increment

    if (debug && verboseOutput) {
      console.group('Reader#handlePageNavigation')
      console.log(
        'spreadIndex: %d; nextIndex: %d; lastSpreadIndex %d',
        spreadIndex,
        nextIndex,
        lastSpreadIndex
      )
      console.groupEnd()
    }

    if (nextIndex > lastSpreadIndex || nextIndex < 0) {
      // move to next or prev chapter
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

  handleChapterNavigation(increment) {
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
      const { lastSpreadIndex } = this.state
      const firstSpread = spreadIndex === 0
      const lastSpread = spreadIndex === lastSpreadIndex
      const spreadDelta = 0
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
          this.scrollToTop()
          if (direction === -1) this.navigateToSpreadByIndex(lastSpreadIndex) // TODO: navigate to last visited page
          this.enableEventHandling()
          this.hideSpinner()

          Messenger.sendPaginationEvent(this.state)
        }
      )

      if (logTime) console.timeEnd('Content Visible')
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

  navigateToSpreadByIndex(spreadIndex) {
    this.setState({ spreadIndex }, this.updateQueryString)
  }

  navigateToElementById(hash) {
    // get the element we need to navigate to in the layout
    const elem = document.querySelector(hash)

    if (!elem) return console.warn(`Could not find element ${hash}`)

    // scroll to vertical position, leave a bit of room for the controls and
    // whitespace around the element
    if (Viewport.isMobile()) {
      const padding = 25
      const offset =
        document.querySelector('.controls__header').offsetHeight + padding
      const top = elem.offsetTop - offset
      document.getElementById('frame').scrollTo(0, top)
    }

    const { paddingTop, paddingBottom, columnGap } = this.state.viewerSettings

    // we calculate the frameHeight using the same method in Layout.jsx, by
    // rounding the window height minus the padding top and bottom of the
    // reader's frame
    const height = window.innerHeight
    const frameHeight = Math.round(height - paddingTop - paddingBottom)

    // find the index of the spread that our element appears on by getting
    // it's left-most value (accounting for the gutter), and dividing it by
    // the height of a single column
    const left = elem.offsetLeft - columnGap
    const spreadIndex = Math.floor(left / frameHeight / 2)

    // we move to the desired spread when the query string actually updates
    this.setState({ spreadIndex }, this.updateQueryString)
  }

  navigateToChapterByURL(absoluteURL) {
    const { spine } = this.state
    const url = new window.URL(absoluteURL)

    // Can eventually handle hashes or query strings here
    const absoluteURL_ = `${url.origin}${url.pathname}`

    let deferredCallback
    const { hash } = url
    if (hash) {
      if (logTime) console.time('deferredCallback')

      deferredCallback = () => {
        setTimeout(() => {
          // this.enablePageTransitions()
          this.navigateToElementById(hash)
          this.enableEventHandling()
          this.hideSpinner()

          if (logTime) console.timeEnd('Content Visible')
          // TODO: should match transition speed. all these deferreds should be collected together
          // @issue: https://github.com/triplecanopy/b-ber/issues/216
        }, MAX_DEFERRED_CALLBACK_TIMEOUT)
      }
    }

    const currentSpineItemIndex = findIndex(spine, {
      absoluteURL: absoluteURL_,
    })
    if (currentSpineItemIndex === this.state.currentSpineItemIndex) {
      return this.closeSidebars()
    }
    if (currentSpineItemIndex < 0) {
      console.warn(`No spine item found for ${absoluteURL_}`)
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

  savePosition() {
    if (useLocalStorage === false) return

    const {
      hash,
      currentSpineItem,
      currentSpineItemIndex,
      spreadIndex,
    } = this.state

    const storage = Storage.get(this.localStorageKey)
    storage[hash] = { currentSpineItem, currentSpineItemIndex, spreadIndex }

    Storage.set(this.localStorageKey, storage)
  }

  // eslint-disable-next-line class-methods-use-this
  destroyReaderComponent() {
    history.push('/', { bookURL: null })
  }

  registerOverlayElementId(overlayElementId) {
    if (this.state.overlayElementId !== overlayElementId) {
      this.setState({ overlayElementId })
    }
  }

  deRegisterOverlayElementId() {
    this.setState({ overlayElementId: null })
  }

  _setState(props) {
    this.setState({ ...props })
  }

  // eslint-disable-next-line class-methods-use-this
  handleScriptCreate() {
    console.log('handleScriptCreate')
  }
  // eslint-disable-next-line class-methods-use-this
  handleScriptError() {
    console.log('handleScriptError')
  }
  // eslint-disable-next-line class-methods-use-this
  handleScriptLoad() {
    console.log('handleScriptLoad')
  }

  render() {
    const {
      metadata,
      guide,
      spine,
      currentSpineItemIndex,
      showSidebar,
      hash,
      ready,
      bookURL,
      spreadIndex,
      lastSpreadIndex,
      viewerSettings,
      pageAnimation,
      handleEvents,
      spinnerVisible,
    } = this.state

    return (
      <Controls
        guide={guide}
        spine={spine}
        currentSpineItemIndex={currentSpineItemIndex}
        metadata={metadata}
        showSidebar={showSidebar}
        viewerSettings={viewerSettings}
        handleEvents={handleEvents}
        spreadIndex={spreadIndex}
        lastSpreadIndex={lastSpreadIndex}
        enablePageTransitions={this.enablePageTransitions}
        handlePageNavigation={this.handlePageNavigation}
        updateViewerSettings={this.updateViewerSettings}
        destroyReaderComponent={this.destroyReaderComponent}
        handleChapterNavigation={this.handleChapterNavigation}
        handleSidebarButtonClick={this.handleSidebarButtonClick}
        navigateToChapterByURL={this.navigateToChapterByURL}
        downloads={this.props.downloads}
        uiOptions={this.props.uiOptions}
      >
        <Frame
          hash={hash}
          ready={ready}
          bookURL={bookURL}
          spreadIndex={spreadIndex}
          lastSpreadIndex={lastSpreadIndex}
          BookContent={BookContent}
          pageAnimation={pageAnimation}
          setReaderState={this._setState}
          viewerSettings={viewerSettings}
        />
        <Spinner spinnerVisible={spinnerVisible} />
      </Controls>
    )
  }
}

export default withDeferredCallbacks(Reader)
