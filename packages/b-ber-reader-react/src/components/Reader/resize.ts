import Viewport from '../../helpers/Viewport'
import { ViewerSettings } from '../../models'
import type { ReaderInstance } from './types'

export function handleResize(this: ReaderInstance): void {
  if (this.state.disableMobileResizeEvents) return

  const viewerSettings = new ViewerSettings()
  const scrollingLayout = Viewport.isVerticallyScrolling(
    this.props.readerSettings
  )

  viewerSettings.width = window.innerWidth
  // The model types height as number, but the scroll layout stores the string
  // 'auto' here (consumers branch on isNumeric); cast to preserve behavior.
  viewerSettings.height = (scrollingLayout
    ? 'auto'
    : window.innerHeight) as unknown as number

  this.props.viewerSettingsActions.update(viewerSettings.get())
}

export function handleResizeStart(this: ReaderInstance): void {
  if (this.state.disableMobileResizeEvents) return

  // Hide the UI behind the spinnner while the window is being resized and
  // dimensions recalculated
  this.freeze()

  // Restart the layout-stability watch. Unlike a chapter change (where
  // BookContent remounts and a fresh <Ultimate> begins watching on mount), a
  // resize keeps the same Ultimate instance mounted — the only thing that
  // re-arms its watch is view.loaded flipping true → false. Without this, the
  // spinner shown by freeze() above would never hide again (Ultimate's
  // onStable never fires), producing an infinite spinner on resize. freeze()
  // deliberately omits unload() to avoid restarting the OLD chapter's Ultimate
  // during navigation; the resize path is the case that genuinely needs it.
  this.props.viewActions.unload()

  const { spreadIndex } = this.state
  const { lastSpreadIndex } = this.props.view

  let relativeSpreadPosition = 0
  if (spreadIndex > 0 && lastSpreadIndex > 0) {
    relativeSpreadPosition = spreadIndex / lastSpreadIndex
  }

  // Save the relative position (float) to calculate next position
  // after resize
  this.setState({ relativeSpreadPosition })
}

export function handleResizeEnd(this: ReaderInstance): void {
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

export function bindResizeHandlers(this: ReaderInstance): void {
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

export function unbindResizeHandlers(this: ReaderInstance): void {
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
