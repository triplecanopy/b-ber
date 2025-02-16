import findIndex from 'lodash/findIndex'
import Url from '../../helpers/Url'
import Viewport from '../../helpers/Viewport'

export function handlePageNavigation(increment) {
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
    }
  )
}

export function handleChapterNavigation(increment) {
  console.log('handleChapterNavigation', increment)

  let { currentSpineItemIndex } = this.state

  const { spine } = this.state
  const nextIndex = currentSpineItemIndex + increment
  const firstChapter = nextIndex < 0
  const lastChapter = nextIndex > spine.length - 1

  if (firstChapter || lastChapter) {
    this.setState({ firstChapter, lastChapter })
    return
  }

  currentSpineItemIndex = nextIndex

  const currentSpineItem = spine[nextIndex]
  const spreadIndex = 0

  // TODO move this logic
  // let deferredCallback = direction => () => {
  //   const { lastSpreadIndex } = this.props.view
  //   const firstSpread = spreadIndex === 0
  //   const lastSpread = spreadIndex === lastSpreadIndex
  //   const spreadDelta = direction

  //   lastChapter = currentSpineItemIndex === spine.length - 1

  //   this.setState(
  //     {
  //       firstChapter,
  //       lastChapter,
  //       firstSpread,
  //       lastSpread,
  //       spreadDelta,
  //     },
  //     () => {
  //       if (direction === -1) {
  //         this.navigateToSpreadByIndex(lastSpreadIndex)
  //       }

  //       console.log('this.props.userInterfaceActions.update')
  //       this.props.userInterfaceActions.update({
  //         handleEvents: true,
  //         spinnerVisible: false,
  //       })
  //     }
  //   )
  // }

  // deferredCallback = deferredCallback(increment)

  this.setState(
    {
      spreadIndex,
      currentSpineItem,
      currentSpineItemIndex,
      showSidebar: null,
      firstChapter,
      lastChapter,
      spreadDelta: increment,
      chapterDelta: increment,
    },
    () => {
      this.loadSpineItem(currentSpineItem /*, deferredCallback */)
      this.savePosition()
    }
  )
}

export function navigateToSpreadByIndex(spreadIndex) {
  this.setState({ spreadIndex }, this.updateQueryString)
}

export function navigateToElementById(id) {
  // Get the element to which the page will scroll in the layout
  const elem = document.querySelector(id)

  if (!elem) return console.warn(`Could not find element ${id}`)

  // Scroll to vertical position, leave a bit of room for the controls and
  // whitespace around the element
  if (Viewport.isVerticallyScrolling(this.props.readerSettings)) {
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

export function navigateToChapterByURL(absoluteURL) {
  const { spine } = this.state
  const url = new window.URL(absoluteURL)

  // Can eventually handle hashes or query strings here
  const nextAbsolutURL = `${url.origin}${url.pathname}`

  // let deferredCallback
  // const { hash: id } = url

  // TODO move this logic
  // if (id) {
  //   deferredCallback = () => {
  //     this.navigateToElementById(id)

  //     this.props.userInterfaceActions.update({
  //       handleEvents: true,
  //       spinnerVisible: false,
  //     })
  //   }
  // }

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

  this.props.userInterfaceActions.disablePageTransitions()

  this.setState(
    {
      currentSpineItem,
      currentSpineItemIndex,
      spreadIndex,
    },
    () => {
      this.loadSpineItem(currentSpineItem /*, deferredCallback */)
      this.savePosition()
    }
  )
}

export function updateQueryString(callback) {
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

export function savePosition() {
  const { currentSpineItemIndex, spreadIndex } = this.state
  const { searchParamKeys } = this.props.readerSettings

  const params = new URLSearchParams()

  params.set(searchParamKeys.currentSpineItemIndex, currentSpineItemIndex)
  params.set(searchParamKeys.spreadIndex, spreadIndex)

  const location = { searchParams: params.toString() }

  this.props.readerLocationActions.updateLocalStorage(location)
}
