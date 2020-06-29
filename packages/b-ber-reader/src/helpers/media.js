import omit from 'lodash/omit'
import Url from './Url'
import Viewport from './Viewport'

export const getPlayerPropsFromQueryString = queryString =>
  Url.parseQueryString(queryString)

export const getURLAndQueryParamters = url => url.split('?')

export const transformQueryParamsToProps = (props, blacklist = []) => {
  // Remove blacklisted props
  let options = props
  if (blacklist.length) options = omit(props, blacklist)

  // Cast boolean attributes
  const truthy = new Set(['true', '1'])
  const falsey = new Set(['false', '0'])
  const bools = new Set([...truthy, ...falsey])

  const nextOptions = Object.entries(options).reduce((acc, [key, value]) => {
    acc[key] = bools.has(value) ? truthy.has(value) : value
    return acc
  }, {})

  // Autoplay on mobile
  nextOptions.playsinline = true

  return nextOptions
}

export const getPlayingStateOnUpdate = (
  state,
  props,
  nextProps,
  nextContext
) => {
  // Only elements with an autoplay attribute
  if (!state.autoplay) return false

  // Only if the view is fully rendered
  if (!props.view.loaded) return false
  if (nextProps.view.pendingDeferredCallbacks) return false

  let { currentSpreadIndex } = state

  // The index that the element is rendered on as calculated by
  // withNodePosition
  const { spreadIndex: elementSpreadIndex } = nextProps

  // The spread index that's currently in view
  const { spreadIndex: visibleSpreadIndex } = nextContext

  // Only if user is navigating to a new spread
  if (currentSpreadIndex === visibleSpreadIndex) return false

  // Update the `currentSpreadIndex` so that the user can continue to interact
  // with the video (play/pause) as normal
  currentSpreadIndex = visibleSpreadIndex

  // Play or pause the video
  const playing =
    elementSpreadIndex === visibleSpreadIndex && !Viewport.isMobile()

  return { playing, currentSpreadIndex }
}
