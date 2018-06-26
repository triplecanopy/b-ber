import React, {Component} from 'react'
import PropTypes from 'prop-types'
import findIndex from 'lodash/findIndex'
import debounce from 'lodash/debounce'
import {Controls, Frame, Spinner} from './'
import {Request, XMLAdaptor, Asset, Url} from '../helpers'
import Viewport from '../helpers/Viewport'
import {ViewerSettings} from '../models'
import {debug, verboseOutput, useLocalStorage} from '../config'
import history from '../lib/History'
import deferrable from '../lib/decorate-deferrable'
import Messenger from '../lib/Messenger'

let _bookContent = null

const getBookContent = () => _bookContent

const bookContentComponent = () => (
    <div>
        {getBookContent()}
    </div>
)

@deferrable
class Reader extends Component {
    static childContextTypes = {
        spreadIndex: PropTypes.number,
        overlayElementId: PropTypes.string,
        navigateToChapterByURL: PropTypes.func,
        registerOverlayElementId: PropTypes.func,
        deRegisterOverlayElementId: PropTypes.func,
        requestDeferredCallbackExecution: PropTypes.func,
    }
    constructor(props) {
        super(props)

        // TODO: move this to viewerSettings, should probably be default behaviour
        this.gridColumns = () => Viewport.isMobile() ? 8 : 12
        this.gridSettingsOptions = {
            paddingLeft: () => window.innerWidth / this.gridColumns(),
            paddingRight: () => window.innerWidth / this.gridColumns(),
        }

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
            viewerSettings: new ViewerSettings(this.gridSettingsOptions),
            pageAnimation: false, // disabled by default, and activated in Reader#enablePageTransitions on user action
            overlayElementId: null,
            spinnerVisible: true,
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


        this.debounceResizeSpeed = 400
        this.handleResizeStart = debounce(this.handleResizeStart, this.debounceResizeSpeed, {leading: true, trailing: false}).bind(this)
        this.handleResizeEnd = debounce(this.handleResizeEnd, this.debounceResizeSpeed, {leading: false, trailing: true}).bind(this)
    }

    getChildContext() {
        return {
            spreadIndex: this.state.spreadIndex,
            navigateToChapterByURL: this.navigateToChapterByURL,
            overlayElementId: this.state.overlayElementId,
            registerOverlayElementId: this.registerOverlayElementId,
            deRegisterOverlayElementId: this.deRegisterOverlayElementId,
            requestDeferredCallbackExecution: this.requestDeferredCallbackExecution,
        }
    }

    componentWillMount() {
        this.registerCanCallDeferred(_ => this.state.ready)
        this.createStateFromOPF().then(_ => {
            if (useLocalStorage === false) return this.loadSpineItem()

            const storage = window.localStorage.getItem(this.localStorageKey)
            if (!storage) return this.loadSpineItem()
            const storage_ = JSON.parse(storage)

            this.updateViewerSettings(storage_.viewerSettings)
            this.loadInitialSpineItem(storage_)
        })
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize, false)
        window.addEventListener('resize', this.handleResizeStart, false)
        window.addEventListener('resize', this.handleResizeEnd, false)
    }

    componentWillReceiveProps(nextProps) {
        const {hash, cssHash} = this.state
        if (hash === null) {
            this.setState({hash: nextProps.hash})
        }
        if (cssHash === null) {
            this.setState({scopedCSS: nextProps.cssHash})
        }
    }

    shouldComponentUpdate(_, nextState) {
        const {ready} = nextState
        if (ready && ready !== this.state.ready) {
            if (debug && verboseOutput) console.log('Reader#shouldComponentUpdate: requestDeferredCallbackExecution', `ready: ${ready}`)
            this.requestDeferredCallbackExecution()
        }

        return true
    }

    componentWillUnmount() {
        const {cssHash} = this.state
        this.setState({hash: null, cssHash: null})
        Asset.removeBookStyles(cssHash)
    }

    handleResize() {
        const viewerSettings = new ViewerSettings(this.gridSettingsOptions)
        this.setState({viewerSettings})
    }

    handleResizeStart() {
        this.disablePageTransitions()
        if (!debug) this.showSpinner()
    }
    handleResizeEnd() {
        if (!debug) this.hideSpinner()
    }

    updateQueryString() {
        const {currentSpineItem, currentSpineItemIndex, spreadIndex} = this.state
        const {slug} = currentSpineItem
        const {pathname, state} = history.location

        const search = Url.buildQueryString({
            slug,
            currentSpineItemIndex,
            spreadIndex,
        })

        history.push({
            pathname,
            search,
            state,
        })
    }

    showSpinner() {
        this.setState({spinnerVisible: true})
    }
    hideSpinner() {
        this.setState({spinnerVisible: false})
    }

    updateViewerSettings(settings = {}) {
        if (useLocalStorage === false) return

        const viewerSettings = new ViewerSettings(this.gridSettingsOptions)
        viewerSettings.put(settings)
        this.setState({viewerSettings}, this.saveViewerSettings)
    }

    // currently viewer settings are global (for all books) although they could
    // be scoped to individual books using the books' hash
    saveViewerSettings() {
        if (useLocalStorage === false) return

        const viewerSettings = {...this.state.viewerSettings.settings}
        let storage = window.localStorage.getItem(this.localStorageKey)
        storage = storage ? JSON.parse(storage) : {}

        if (!storage.viewerSettings) storage.viewerSettings = {}
        storage.viewerSettings = {...storage.viewerSettings, ...viewerSettings}
        storage = JSON.stringify(storage)

        window.localStorage.setItem(this.localStorageKey, storage)
    }

    loadInitialSpineItem(storage) {
        const {hash} = this.state
        if (!storage[hash] || !storage[hash].currentSpineItem) {
            return this.loadSpineItem()
        }

        const {currentSpineItem, currentSpineItemIndex, spreadIndex} = storage[hash]
        this.setState({currentSpineItem, currentSpineItemIndex, spreadIndex}, _ => this.loadSpineItem(currentSpineItem))
    }

    createStateFromOPF() {
        const {bookURL} = this.state
        const opfURL = XMLAdaptor.opfURL(bookURL)
        const opsURL = XMLAdaptor.opsURL(bookURL)

        this.setState({opsURL})

        return Request.get(opfURL)
            .then(XMLAdaptor.parseOPF)
            .then(data => XMLAdaptor.parseNCX(data, opsURL))
            .then(data => Promise.all([
                XMLAdaptor.createGuideItems(data),
                XMLAdaptor.createSpineItems(data),
            ]))
            .then(([a, b]) => {
                const data = {...a, ...b}
                return Promise.all([
                    XMLAdaptor.udpateGuideItemURLs(data, opsURL),
                    XMLAdaptor.udpateSpineItemURLs(data, opsURL),
                ])
            })
            .then(([a, b]) => XMLAdaptor.createBookMetadata({...a, ...b}))
            .then(data => this.setState({...data}))
            .catch(console.error)
    }

    enablePageTransitions() {
        this.setState({pageAnimation: true})
    }
    disablePageTransitions() {
        this.setState({pageAnimation: false})
    }
    enableEventHandling() {
        this.setState({handleEvents: true})
    }
    disableEventHandling() {
        this.setState({handleEvents: false})
    }
    closeSidebars() {
        this.setState({showSidebar: null})
    }


    loadSpineItem(spineItem, deferredCallback) {
        let requestedSpineItem = spineItem
        if (!requestedSpineItem) [requestedSpineItem] = this.state.spine

        this.setState({ready: false})
        this.closeSidebars()
        this.disableEventHandling()
        this.disablePageTransitions()
        this.showSpinner()

        Request.get(requestedSpineItem.absoluteURL)
            // basically we're passing in props to a dehydrated tree here.
            // should be cleaned up a bit
            .then(data => XMLAdaptor.parseSpineItemResponse({
                data,
                requestedSpineItem,
                ...this.state,
                navigateToChapterByURL: this.navigateToChapterByURL,
                paddingLeft: this.state.viewerSettings.paddingLeft,
                columnGap: this.state.viewerSettings.columnGap,
            }))

            .then(({bookContent, scopedCSS}) => {
                const {hash} = this.state

                _bookContent = bookContent

                if (this.state.cssHash === null) {
                    this.setState({cssHash: hash})
                    Asset.appendBookStyles(scopedCSS, hash)
                }
            })
            .then(_ => {
                this.setState({
                    currentSpineItem: requestedSpineItem,
                    spineItemURL: requestedSpineItem.absoluteURL,
                }, _ => {
                    this.updateQueryString()

                    if (deferredCallback) {
                        this.registerDeferredCallback(deferredCallback)
                    }

                    else {
                        // this.enablePageTransitions()
                        this.enableEventHandling()
                        this.hideSpinner()
                        // this.requestDeferredCallbackExecution()
                    }

                    // this.setState({ready: true})
                    return Promise.resolve()
                })
            })
            .catch(console.error)
    }

    handleSidebarButtonClick(value) {
        let {showSidebar} = this.state
        showSidebar = value === showSidebar ? null : value
        this.setState({showSidebar})
    }

    handlePageNavigation(increment) {
        let {spreadIndex} = this.state
        const {spreadTotal} = this.state
        const nextIndex = spreadIndex + increment

        if (debug && verboseOutput) {
            console.group('Reader#handlePageNavigation')
            console.log('spreadIndex: %d; nextIndex: %d; spreadTotal %d',
                         spreadIndex, nextIndex, spreadTotal) // eslint-disable-line indent
            console.groupEnd()
        }

        if (nextIndex > spreadTotal || nextIndex < 0) {
            // move to next or prev chapter
            const sign = Math.sign(increment)
            this.handleChapterNavigation(sign)

            return
        }

        spreadIndex = nextIndex
        this.setState({spreadIndex, showSidebar: null}, this.updateQueryString)
    }

    handleChapterNavigation(increment) {
        let {currentSpineItemIndex} = this.state
        const {spine} = this.state
        const nextIndex = currentSpineItemIndex + increment


        const firstPage = nextIndex < 0
        const lastPage = nextIndex > spine.length - 1

        if (firstPage || lastPage) {
            this.setState({firstPage, lastPage}, _ => Messenger.sendPaginationEvent(this.state))
            return
        }

        currentSpineItemIndex = nextIndex
        const currentSpineItem = spine[nextIndex]
        const spreadIndex = 0 // TODO: why not getting this from state?

        let deferredCallback
        if (increment === -1) {
            deferredCallback = _ => {
                const {spreadTotal} = this.state
                this.navigateToSpreadByIndex(spreadTotal)

                // this.enablePageTransitions()
                this.enableEventHandling()
                this.hideSpinner()

                Messenger.sendPaginationEvent(this.state)
            }
        }

        // this branch smoothes out page transisitions when moving forward
        else {
            deferredCallback = _ => {
                // this.enablePageTransitions()
                this.enableEventHandling()
                this.hideSpinner()

                Messenger.sendPaginationEvent(this.state)
            }
        }

        this.setState({
            spreadIndex,
            currentSpineItem,
            currentSpineItemIndex,
            showSidebar: null,
            firstPage,
            lastPage,
        }, _ => {
            this.loadSpineItem(currentSpineItem, deferredCallback)
            this.savePosition()
        })
    }

    navigateToSpreadByIndex(spreadIndex) {
        this.setState({spreadIndex}, this.updateQueryString)
    }

    navigateToElementById(hash) {
        const elem = document.querySelector(hash)
        if (!elem) return console.warn(`Could not find element ${hash}`)

        const windowWidth = window.innerWidth
        const {x} = elem.getBoundingClientRect()
        const spreadIndex = Math.floor(x / windowWidth)

        this.setState({spreadIndex}, this.updateQueryString)
    }

    navigateToChapterByURL(absoluteURL) {
        const {spine} = this.state
        const url = new window.URL(absoluteURL)
        const absoluteURL_ = `${url.origin}${url.pathname}` // TODO: handle hashes, query strings

        let deferredCallback
        const {hash} = url
        if (hash) {
            deferredCallback = _ => {
                this.navigateToElementById(hash)

                setTimeout(_ => {
                    // this.enablePageTransitions()
                    this.enableEventHandling()
                    this.hideSpinner()
                }, 100) // TODO: should match transition speed. all these deferreds should be collected together
            }
        }

        const currentSpineItemIndex = findIndex(spine, {absoluteURL: absoluteURL_})
        if (currentSpineItemIndex === this.state.currentSpineItemIndex) return this.closeSidebars()
        if (currentSpineItemIndex < 0) {
            console.warn(`No spine item found for ${absoluteURL_}`)
            return
        }

        const currentSpineItem = spine[currentSpineItemIndex]
        const spreadIndex = 0
        const pageAnimation = false

        this.setState({currentSpineItem, currentSpineItemIndex, spreadIndex, pageAnimation}, _ => {
            this.loadSpineItem(currentSpineItem, deferredCallback)
            this.savePosition()
        })
    }

    savePosition() {
        if (useLocalStorage === false) return

        const {hash, currentSpineItem, currentSpineItemIndex, spreadIndex} = this.state
        let storage = window.localStorage.getItem(this.localStorageKey)
        if (!storage) storage = JSON.stringify({})

        storage = JSON.parse(storage)
        storage[hash] = {currentSpineItem, currentSpineItemIndex, spreadIndex}

        const storage_ = JSON.stringify(storage)
        window.localStorage.setItem(this.localStorageKey, storage_)
    }

    destroyReaderComponent() { // eslint-disable-line class-methods-use-this
        history.push('/', {bookURL: null})
    }

    registerOverlayElementId(overlayElementId) {
        this.setState({overlayElementId})
    }

    deRegisterOverlayElementId() {
        this.setState({overlayElementId: null})
    }

    _setState(props) {
        this.setState({...props})
    }

    render() {
        const {
            metadata,
            guide,
            spine,
            showSidebar,
            hash,
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
                metadata={metadata}
                showSidebar={showSidebar}
                viewerSettings={viewerSettings}
                handleEvents={handleEvents}
                enablePageTransitions={this.enablePageTransitions}
                handlePageNavigation={this.handlePageNavigation}
                updateViewerSettings={this.updateViewerSettings}
                destroyReaderComponent={this.destroyReaderComponent}
                handleChapterNavigation={this.handleChapterNavigation}
                handleSidebarButtonClick={this.handleSidebarButtonClick}
                navigateToChapterByURL={this.navigateToChapterByURL}
                downloads={this.props.downloads}
            >
                <Frame
                    hash={hash}
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
