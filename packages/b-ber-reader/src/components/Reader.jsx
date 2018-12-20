import React, { Component } from 'react'
import PropTypes from 'prop-types'
import findIndex from 'lodash/findIndex'
import debounce from 'lodash/debounce'
import find from 'lodash/find'
import { Controls, Frame, Spinner } from '.'
import { Request, XMLAdaptor, Asset, Url, Cache, Storage } from '../helpers'
import { ViewerSettings } from '../models'
import { debug, logTime, verboseOutput, useLocalStorage } from '../config'
import history from '../lib/History'
import deferrable from '../lib/decorate-deferrable'
import Messenger from '../lib/Messenger'
import Viewport from '../helpers/Viewport'

const MAX_RENDER_TIMEOUT = 0
const MAX_DEFERRED_CALLBACK_TIMEOUT = 0

let _bookContent = null

const getBookContent = () => _bookContent

const bookContentComponent = () => <div>{getBookContent()}</div>

@deferrable
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

            // layout
            hash: Asset.createHash(this.props.bookURL),
            cssHash: null,

            // navigation
            spreadIndex: 0,
            spreadTotal: 0,
            handleEvents: false,
            firstPage: false,
            lastPage: false,

            // sidebar
            showSidebar: null,

            // view
            viewerSettings: new ViewerSettings(),
            pageAnimation: false, // disabled by default, and activated in Reader#enablePageTransitions on user action
            overlayElementId: null,
            spinnerVisible: true,

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
        this.deRegisterOverlayElementId = this.deRegisterOverlayElementId.bind(
            this,
        )
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
            { leading: true, trailing: false },
        ).bind(this)

        this.handleResizeEnd = debounce(
            this.handleResizeEnd,
            this.debounceResizeSpeed,
            { leading: false, trailing: true },
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
            requestDeferredCallbackExecution: this
                .requestDeferredCallbackExecution,
        }
    }

    componentWillMount() {
        Cache.clear() // clear initially for now. still caches styles for subsequent pages
        this.registerCanCallDeferred(() => this.state.ready)
        this.createStateFromOPF().then(() => {
            if (useLocalStorage === false) return this.loadSpineItem()

            const storage = Storage.get(this.localStorageKey)
            if (!storage) return this.loadSpineItem()

            this.updateViewerSettings(storage.viewerSettings)
            this.loadInitialSpineItem(storage)
        })
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize, false)
        window.addEventListener('resize', this.handleResizeStart, false)
        window.addEventListener('resize', this.handleResizeEnd, false)
    }

    componentWillReceiveProps(nextProps) {
        const { hash, cssHash, search } = this.state

        if (nextProps.search !== search) {
            const {
                slug,
                currentSpineItemIndex,
                spreadIndex,
            } = Url.parseQueryString(nextProps.search)
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
                    `ready: ${ready}`,
                )
            }
            this.requestDeferredCallbackExecution()
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
        const {
            currentSpineItem,
            currentSpineItemIndex,
            spreadIndex,
        } = this.state

        const { slug } = currentSpineItem
        const url = Url.parseQueryString(this.props.search)
        const { pathname, state } = history.location
        const update = !url.slug || url.slug === slug ? 'replace' : 'push'

        const search = Url.buildQueryString({
            slug,
            currentSpineItemIndex,
            spreadIndex,
        })

        this.setState({ search }, () =>
            history[update]({
                pathname,
                search,
                state,
            }),
        )
    }

    showSpinner() {
        this.setState({ spinnerVisible: true })
    }
    hideSpinner() {
        this.setState({ spinnerVisible: false })
    }

    updateViewerSettings(settings = {}) {
        if (useLocalStorage === false) return

        const viewerSettings = new ViewerSettings()
        viewerSettings.put(settings)
        this.setState({ viewerSettings }, this.saveViewerSettings)
    }

    // currently viewer settings are global (for all books) although they could
    // be scoped to individual books using the books' hash
    saveViewerSettings() {
        if (useLocalStorage === false) return

        const viewerSettings = { ...this.state.viewerSettings.settings }
        const storage = Storage.get(this.localStorageKey)

        if (!storage.viewerSettings) storage.viewerSettings = {}
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

        const {
            currentSpineItem,
            currentSpineItemIndex,
            spreadIndex,
        } = storage[hash]

        this.setState(
            { currentSpineItem, currentSpineItemIndex, spreadIndex },
            () => {
                this.loadSpineItem(currentSpineItem)
            },
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
                        'XMLAdaptor.createGuideItems(data),XMLAdaptor.createSpineItems(data)',
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
                        'XMLAdaptor.createGuideItems(data),XMLAdaptor.createSpineItems(data)',
                    )
                    console.time(
                        'XMLAdaptor.udpateGuideItemURLs(data, opsURL),XMLAdaptor.udpateSpineItemURLs(data, opsURL)',
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
                        'XMLAdaptor.udpateGuideItemURLs(data, opsURL),XMLAdaptor.udpateSpineItemURLs(data, opsURL)',
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
            .then(data => {
                if (logTime) {
                    console.timeEnd(
                        'Request.get(requestedSpineItem.absoluteURL)',
                    )
                    console.time('XMLAdaptor.parseSpineItemResponse()')
                }
                return XMLAdaptor.parseSpineItemResponse({
                    data,
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

                _bookContent = bookContent

                if (cssHash === null) {
                    cssHash = hash
                    Asset.appendBookStyles(scopedCSS, hash)
                }

                this.setState({ cssHash })
            })
            .then(() => {
                if (logTime) console.time('this.setState({ready: true})')

                this.setState(
                    {
                        currentSpineItem: requestedSpineItem,
                        spineItemURL: requestedSpineItem.absoluteURL,
                    },
                    () => {
                        this.updateQueryString()

                        if (deferredCallback) {
                            this.registerDeferredCallback(deferredCallback)
                        } else {
                            this.enableEventHandling()
                            this.hideSpinner()
                        }

                        return setTimeout(() => {
                            if (logTime) {
                                console.timeEnd('this.setState({ready: true})')
                                console.timeEnd('Reader#loadSpineItem')
                            }
                            // return this.setState({ready: true}) // TODO: force load
                            // @issue: https://github.com/triplecanopy/b-ber/issues/214
                        }, MAX_RENDER_TIMEOUT)
                    },
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

                // this.loadSpineItem()
            })
    }

    handleSidebarButtonClick(value) {
        let { showSidebar } = this.state
        showSidebar = value === showSidebar ? null : value
        this.setState({ showSidebar })
    }

    handlePageNavigation(increment) {
        let { spreadIndex } = this.state
        const { spreadTotal } = this.state
        const nextIndex = spreadIndex + increment

        if (debug && verboseOutput) {
            console.group('Reader#handlePageNavigation')
            console.log(
                'spreadIndex: %d; nextIndex: %d; spreadTotal %d',
                spreadIndex,
                nextIndex,
                spreadTotal,
            )
            console.groupEnd()
        }

        if (nextIndex > spreadTotal || nextIndex < 0) {
            // move to next or prev chapter
            const sign = Math.sign(increment)
            this.handleChapterNavigation(sign)

            return
        }

        spreadIndex = nextIndex
        this.setState(
            { spreadIndex, showSidebar: null },
            this.updateQueryString,
        )
    }

    handleChapterNavigation(increment) {
        let { currentSpineItemIndex } = this.state
        const { spine } = this.state
        const nextIndex = Number(currentSpineItemIndex) + increment

        const firstPage = nextIndex < 0
        const lastPage = nextIndex > spine.length - 1

        if (firstPage || lastPage) {
            this.setState({ firstPage, lastPage }, () =>
                Messenger.sendPaginationEvent(this.state),
            )
            return
        }

        currentSpineItemIndex = nextIndex
        const currentSpineItem = spine[nextIndex]
        const spreadIndex = 0

        let deferredCallback
        if (increment === -1) {
            deferredCallback = () => {
                const { spreadTotal } = this.state

                this.scrollToTop()
                this.navigateToSpreadByIndex(spreadTotal)
                this.enableEventHandling()
                this.hideSpinner()

                Messenger.sendPaginationEvent(this.state)

                if (logTime) console.timeEnd('Content Visible')
            }
        } else {
            // this branch smoothes out page transisitions when moving forward
            deferredCallback = () => {
                this.scrollToTop()
                this.enableEventHandling()
                this.hideSpinner()

                Messenger.sendPaginationEvent(this.state)

                if (logTime) console.timeEnd('Content Visible')
            }
        }

        this.setState(
            {
                spreadIndex,
                currentSpineItem,
                currentSpineItemIndex,
                showSidebar: null,
                firstPage,
                lastPage,
            },
            () => {
                this.loadSpineItem(currentSpineItem, deferredCallback)
                this.savePosition()
            },
        )
    }

    navigateToSpreadByIndex(spreadIndex) {
        this.setState({ spreadIndex }, this.updateQueryString)
    }

    navigateToElementById(hash) {
        const elem = document.querySelector(hash)
        if (!elem) return console.warn(`Could not find element ${hash}`)

        const windowWidth = window.innerWidth
        const { x } = elem.getBoundingClientRect()
        const spreadIndex = Math.floor(x / windowWidth)

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
                    // @issue: https://github.com/triplecanopy/b-ber/issues/215
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
            },
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

        let storage = window.localStorage.getItem(this.localStorageKey)
        if (!storage) storage = JSON.stringify({})

        storage = JSON.parse(storage)
        storage[hash] = { currentSpineItem, currentSpineItemIndex, spreadIndex }

        const storage_ = JSON.stringify(storage)
        window.localStorage.setItem(this.localStorageKey, storage_)
    }

    // eslint-disable-next-line class-methods-use-this
    destroyReaderComponent() {
        history.push('/', { bookURL: null })
    }

    registerOverlayElementId(overlayElementId) {
        this.setState({ overlayElementId })
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
            spreadTotal,
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
                spreadTotal={spreadTotal}
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
                    spreadTotal={spreadTotal}
                    bookContent={bookContentComponent}
                    pageAnimation={pageAnimation}
                    setReaderState={this._setState}
                    viewerSettings={viewerSettings}
                />
                <Spinner spinnerVisible={spinnerVisible} />
            </Controls>
        )
    }
}

export default Reader
