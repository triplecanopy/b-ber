import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as viewerSettingsActions from '../actions/viewer-settings'
import { columns } from '../constants'
import { isNumeric } from '../helpers/Types'
import Viewport from '../helpers/Viewport'
import type {
  AppDispatch,
  RootState,
  ViewerSettingsState,
} from '../store/types'

// Props read off `this.props`. viewerSettings comes from connect()ed state;
// viewerSettingsActions is the bound dispatch bundle. Own props passed through
// by the owner are merged loosely (`any`) — the connect/spread plumbing is not
// expressible precisely here.
interface InjectedProps {
  viewerSettings: ViewerSettingsState
  // `layout` is read by Viewport.isVerticallyScrolling(this.props).
  layout: string
  viewerSettingsActions: {
    update: (payload: Partial<ViewerSettingsState>) => void
  }
}

const withDimensions = (
  WrappedComponent: React.ComponentType<any>
): React.ComponentType<any> => {
  class WrapperComponent extends React.Component<InjectedProps> {
    constructor(props: InjectedProps) {
      super(props)

      this.getFrameWidth = this.getFrameWidth.bind(this)
      this.getFrameHeight = this.getFrameHeight.bind(this)
      this.getSingleColumnWidth = this.getSingleColumnWidth.bind(this)
      this.updateDimensions = this.updateDimensions.bind(this)
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
      this.updateDimensions()
    }

    getWidth = (scrollingLayout: boolean): number => {
      // Column layout, return the window width
      if (!scrollingLayout) return window.innerWidth

      // Scrolling layout, but not a mobile device, return the window width
      if (/mobi/i.test(window.navigator.userAgent) === false) {
        return window.innerWidth
      }

      // Get the device orientation and return either the screen height or width
      const { matches: landscapeOrientation } = window.matchMedia(
        '(orientation: landscape)'
      )

      return landscapeOrientation ? window.screen.height : window.screen.width
    }

    updateDimensions() {
      const scrollingLayout = Viewport.isVerticallyScrolling(this.props)
      const width = this.getWidth(scrollingLayout)
      // The scroll layout stores 'auto' for height (consumers branch on
      // isNumeric); the store types height as number, so cast to preserve it.
      const height = (scrollingLayout
        ? 'auto'
        : window.innerHeight) as unknown as number
      const nextColumns = scrollingLayout ? columns.ONE : columns.TWO

      this.props.viewerSettingsActions.update({
        width,
        height,
        columns: nextColumns,
      })
    }

    getFrameHeight() {
      if (Viewport.isVerticallyScrolling(this.props)) {
        return 'auto'
      }

      let { height } = this.props.viewerSettings
      const { paddingTop, paddingBottom } = this.props.viewerSettings

      // make sure we're not treating 'auto' as a number
      if (!isNumeric(height)) height = window.innerHeight

      height -= paddingTop
      height -= paddingBottom

      return height
    }

    getFrameWidth() {
      const { width, paddingLeft, paddingRight, columnGap } =
        this.props.viewerSettings

      return width - paddingLeft - paddingRight - columnGap
    }

    getSingleColumnWidth() {
      return this.getFrameWidth() / 2
    }

    render() {
      return (
        <WrappedComponent
          getFrameHeight={this.getFrameHeight}
          getFrameWidth={this.getFrameWidth}
          getSingleColumnWidth={this.getSingleColumnWidth}
          updateDimensions={this.updateDimensions}
          {...this.props}
        />
      )
    }
  }

  return connect(
    ({ viewerSettings }: RootState) => ({ viewerSettings }),
    (dispatch: AppDispatch) => ({
      viewerSettingsActions: bindActionCreators(
        viewerSettingsActions,
        dispatch
      ),
    })
  )(WrapperComponent)
}

export default withDimensions
