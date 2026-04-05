import { ViewerSettings } from '../../models'
import Viewport from '../../helpers/Viewport'

export function handleResize() {
  if (this.state.disableMobileResizeEvents) return

  const viewerSettings = new ViewerSettings()
  const scrollingLayout = Viewport.isVerticallyScrolling(
    this.props.readerSettings
  )

  viewerSettings.width = window.innerWidth
  viewerSettings.height = scrollingLayout ? 'auto' : window.innerHeight

  this.props.viewerSettingsActions.update(viewerSettings.get())
}

export function handleResizeStart() {
  if (this.state.disableMobileResizeEvents) return

  // Hide the UI behind the spinnner while the window is being resized and
  // dimensions recalculated
  this.freeze()

  const { spreadIndex } = this.state
  const { lastSpreadIndex } = this.props.view

  let relativeSpreadPosition = 0
  if (spreadIndex > 0 && lastSpreadIndex > 0) {
    relativeSpreadPosition = spreadIndex / lastSpreadIndex
  }

  // Save the relative position (float) to calculate next position
  // after resize
  this.setState({ relativeSpreadPosition }, () => {
    // this.props.viewActions.unload()
    // this.props.viewActions.updateLastSpreadIndex(-1)
    // this.props.userInterfaceActions.disablePageTransitions()
    // this.props.userInterfaceActions.showSpinner()
  })
}

export function handleResizeEnd() {
  if (this.state.disableMobileResizeEvents) return

  // Adjust users position so that they're on/close to the page
  // before resize
  const { /*spreadIndex, */ relativeSpreadPosition } = this.state
  const { lastSpreadIndex } = this.props.view

  // Calculate approx. position
  let nextSpreadIndex = Math.round(lastSpreadIndex * relativeSpreadPosition)

  // Clamp to min/max spread indexes
  nextSpreadIndex = Math.max(0, Math.min(nextSpreadIndex, lastSpreadIndex))

  // console.log(
  //   'resize end curr/rel/calc/last spread index',
  //   spreadIndex,
  //   relativeSpreadPosition,
  //   nextSpreadIndex,
  //   lastSpreadIndex
  // )

  // Navigate
  this.navigateToSpreadByIndex(nextSpreadIndex)
  // this.props.userInterfaceActions.hideSpinner()
}

export function bindResizeHandlers() {
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

export function unbindResizeHandlers() {
  window.addEventListener('resize', this.handleResize)
  window.addEventListener('resize', this.handleResizeStart)
  window.addEventListener('resize', this.handleResizeEnd)

  // docusment.addEventListener(
  //   'webkitfullscreenchange mozfullscreenchange fullscreenchange',
  //   this.handleResize
  // )
  document.addEventListener(
    'webkitfullscreenchange mozfullscreenchange fullscreenchange',
    this.handleResizeStart
  )
  document.addEventListener(
    'webkitfullscreenchange mozfullscreenchange fullscreenchange',
    this.handleResizeEnd
  )
}
