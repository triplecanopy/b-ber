import { ViewerSettings } from '../../models'

export function handleResize() {
  if (this.state.disableMobileResizeEvents) return

  const viewerSettings = new ViewerSettings()
  this.props.viewerSettingsActions.update(viewerSettings.get())
}

export function handleResizeStart() {
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

    this.props.userInterfaceActions.disablePageTransitions()
    this.props.userInterfaceActions.showSpinner()
  })
}

export function handleResizeEnd() {
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

  // Round to closest position, adjust if needed
  // nextSpreadIndex = Math.ceil(nextSpreadIndex) + 1

  // Not greater than last spread index
  nextSpreadIndex =
    nextSpreadIndex > lastSpreadIndex ? lastSpreadIndex : nextSpreadIndex

  this.navigateToSpreadByIndex(nextSpreadIndex)

  this.props.userInterfaceActions.hideSpinner()
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
