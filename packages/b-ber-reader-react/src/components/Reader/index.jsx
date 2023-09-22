/* eslint-disable react/no-unused-state */
/* eslint-disable react/no-unused-class-component-methods */
import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import find from 'lodash/find'
import debounce from 'lodash/debounce'
import isInteger from 'lodash/isInteger'
import Controls from '../Controls'
import Frame from '../Frame'
import Spinner from '../Spinner'
import Asset from '../../helpers/Asset'
import Url from '../../helpers/Url'
// import withDeferredCallbacks from '../../lib/with-deferred-callbacks'
import ReaderContext from '../../lib/reader-context'
import Viewport from '../../helpers/Viewport'
import { unlessDefined } from '../../helpers/utils'
import * as viewActions from '../../actions/view'
import * as viewerSettingsActions from '../../actions/viewer-settings'
import * as readerSettingsActions from '../../actions/reader-settings'
import * as readerLocationActions from '../../actions/reader-location'
import * as userInterfaceActions from '../../actions/user-interface'
import {
  handlePageNavigation,
  handleChapterNavigation,
  navigateToSpreadByIndex,
  navigateToElementById,
  navigateToChapterByURL,
  updateQueryString,
  savePosition,
} from './navigation'
import {
  handleResize,
  handleResizeStart,
  handleResizeEnd,
  bindResizeHandlers,
  unbindResizeHandlers,
} from './resize'
import {
  createStateFromOPF,
  showSpineItem,
  loadSpineItem,
  book,
} from './loader'

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

      // Navigation
      // Current spread index
      spreadIndex: 0,

      // Used to calculate next spread position after resize to keep
      // the user at/close to the previous reading position
      relativeSpreadPosition: 0.0,

      firstChapter: false,
      lastChapter: false,
      firstSpread: false,
      lastSpread: false,
      // delta: 0,

      // Sidebar
      showSidebar: null,

      // Resize
      disableMobileResizeEvents: 'ontouchstart' in document.documentElement,
    }

    this.handlePageNavigation = handlePageNavigation.bind(this)
    this.handleChapterNavigation = handleChapterNavigation.bind(this)
    this.navigateToSpreadByIndex = navigateToSpreadByIndex.bind(this)
    this.navigateToElementById = navigateToElementById.bind(this)
    this.navigateToChapterByURL = navigateToChapterByURL.bind(this)
    this.updateQueryString = updateQueryString.bind(this)
    this.savePosition = savePosition.bind(this)

    // this.debounceResizeSpeed = 400
    this.resizeEndTimer = null

    this.bindResizeHandlers = bindResizeHandlers.bind(this)
    this.unbindResizeHandlers = unbindResizeHandlers.bind(this)
    this.handleResize = handleResize.bind(this)
    this.handleResizeStart = handleResizeStart.bind(this)
    this.handleResizeEnd = handleResizeEnd.bind(this)

    // TODO set timer appropriately
    this.handleResizeStart = debounce(this.handleResizeStart, 1000, {
      leading: true,
      trailing: false,
    }).bind(this)

    // TODO set timer appropriately
    this.handleResizeEnd = debounce(this.handleResizeEnd, 1000, {
      leading: false,
      trailing: true,
    }).bind(this)

    this.createStateFromOPF = createStateFromOPF.bind(this)
    this.showSpineItem = showSpineItem.bind(this)
    this.loadSpineItem = loadSpineItem.bind(this)
  }

  async UNSAFE_componentWillMount() {
    // Load the spine, guide, and metadata
    this.createStateFromOPF(() => {
      const { spine } = this.state
      const { readerSettings, readerLocation } = this.props

      // Check the current query string if one exists
      const params = new URLSearchParams(readerLocation.searchParams)
      const currentSpineItemIndex = Number(
        params.get(readerSettings.searchParamKeys.currentSpineItemIndex)
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
    })
  }

  componentWillUnmount() {
    const hash = Asset.createHash(this.props.readerSettings.bookURL)

    Asset.removeBookStyles(hash)

    this.bindResizeHandlers()
  }

  componentDidMount() {
    this.unbindResizeHandlers()
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // const {
    //   loaded: nextLoaded,
    //   lastSpreadIndex: nextLastSpreadIndex,
    //   pendingDeferredCallbacks: nextPendingDeferredCallbacks,
    // } = nextProps.view

    const { searchParams: prevSearchParams } = this.props.readerLocation
    const { searchParams: nextSearchParams } = nextProps.readerLocation

    // The query string has changed in that either
    // 1. There is a new slug (chapter). Load the page asynchronously and let
    //    the post-loaded callbacks update the postion
    // 2. There is a new spread index (page). Update state to initialize the
    //    page transition
    if (nextSearchParams !== prevSearchParams) {
      console.log('willreceiveprops if', nextProps.view)

      const nextParams = Url.parseQueryString(nextSearchParams)

      const slug = nextParams[this.props.readerSettings.searchParamKeys.slug]
      const currentSpineItemIndex = Number(
        nextParams[
          this.props.readerSettings.searchParamKeys.currentSpineItemIndex
        ]
      )
      const spreadIndex = Number(
        nextParams[this.props.readerSettings.searchParamKeys.spreadIndex]
      )

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
        spreadIndex,
      })
    }

    console.log('willreceiveprops else', nextProps.view)

    // Render the view
    // if (
    //   nextLoaded &&
    //   nextLastSpreadIndex !== -1 &&
    //   nextPendingDeferredCallbacks === true
    // ) {
    //   this.props.requestDeferredCallbackExecution()
    // }
  }

  // eslint-disable-next-line react/no-unused-class-component-methods
  closeSidebars = () => this.setState({ showSidebar: null })

  freeze = () => {
    this.props.viewActions.unload()
    this.props.viewActions.updateLastSpreadIndex(-1)

    console.log('this.props.userInterfaceActions.update')
    this.props.userInterfaceActions.update({
      handleEvents: false,
      enableTransitions: false,
      spinnerVisible: true,
    })

    this.setState({ showSidebar: null })
  }

  handleSidebarButtonClick = value => {
    let { showSidebar } = this.state
    showSidebar = value === showSidebar ? null : value
    this.setState({ showSidebar })
  }

  getTranslateX = spreadIndex => {
    const nextSpreadIndex = unlessDefined(spreadIndex, this.state.spreadIndex)

    const {
      width,
      paddingLeft,
      paddingRight,
      columnGap,
    } = this.props.viewerSettings

    const isScrolling = Viewport.isVerticallyScrolling(
      this.props.readerSettings
    )

    let translateX = 0
    if (!isScrolling) {
      translateX =
        (width - paddingLeft - paddingRight + columnGap) * nextSpreadIndex * -1

      // no -0
      translateX =
        translateX === 0 && Math.sign(1 / translateX) === -1 ? 0 : translateX
    }

    return translateX
  }

  // TODO the location.state.bookURL prop is how we're signal to the reader that
  // there is a book loaded, but that the pathname is '/'. Would be good to have
  // this standardized
  destroyReaderComponent = () => {
    this.props.readerSettingsActions.updateSettings({ bookURL: '' })
    // history.push('/')
  }

  getSlug() {
    const { spine, currentSpineItemIndex } = this.state

    if (
      isInteger(currentSpineItemIndex) &&
      spine?.[currentSpineItemIndex]?.slug
    ) {
      return spine[currentSpineItemIndex].slug
    }

    return ''
  }

  render() {
    const { downloads, uiOptions, view, layout, style, className } = this.props

    const {
      metadata,
      guide,
      spine,
      currentSpineItemIndex,
      showSidebar,
      lastSpread,
      spreadIndex,
    } = this.state

    const slug = this.getSlug()

    return (
      <Controls
        guide={guide}
        spine={spine}
        currentSpineItemIndex={currentSpineItemIndex}
        metadata={metadata}
        showSidebar={showSidebar}
        spreadIndex={spreadIndex}
        lastSpreadIndex={view.lastSpreadIndex}
        handlePageNavigation={this.handlePageNavigation}
        destroyReaderComponent={this.destroyReaderComponent}
        handleChapterNavigation={this.handleChapterNavigation}
        handleSidebarButtonClick={this.handleSidebarButtonClick}
        navigateToChapterByURL={this.navigateToChapterByURL}
        downloads={downloads}
        uiOptions={uiOptions}
        layout={layout}
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
            spreadIndex={spreadIndex}
            lastSpreadIndex={view.lastSpreadIndex}
            BookContent={BookContent}
            layout={layout}
            // Can't wrap layout or the withLastSpreadIndex HOC in a way that preserves
            // refs, so pass down `view` as props
            view={view}
            style={style}
            className={className}
          />
          <Spinner />
        </ReaderContext.Provider>
      </Controls>
    )
  }
}

const mapStateToProps = ({
  readerSettings,
  viewerSettings,
  readerLocation,
  view,
  userInterface,
}) => ({
  readerSettings,
  viewerSettings,
  readerLocation,
  view,
  userInterface,
})

const mapDispatchToProps = dispatch => ({
  viewerSettingsActions: bindActionCreators(viewerSettingsActions, dispatch),
  readerSettingsActions: bindActionCreators(readerSettingsActions, dispatch),
  readerLocationActions: bindActionCreators(readerLocationActions, dispatch),
  viewActions: bindActionCreators(viewActions, dispatch),
  userInterfaceActions: bindActionCreators(userInterfaceActions, dispatch),
})

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps
// )(withDeferredCallbacks(Reader))

export default connect(mapStateToProps, mapDispatchToProps)(Reader)
