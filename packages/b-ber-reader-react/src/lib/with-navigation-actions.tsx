import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as userInterfaceActions from '../actions/user-interface'
import type { AppDispatch, RootState } from '../store/types'

// Props the HOC reads off `this.props`. The connect()ed state/dispatch props
// (userInterface, userInterfaceActions) plus the navigation callbacks supplied
// by the owner. Kept loose: the connect/spread plumbing is the part the type
// system can't follow cleanly, so own + injected props are merged as `any`.
interface InjectedProps {
  userInterface: { handleEvents: boolean }
  userInterfaceActions: { enablePageTransitions: () => void }
  handleChapterNavigation: (increment: number) => void
  handlePageNavigation: (increment: number) => void
}

const withNavigationActions = (
  WrappedComponent: React.ComponentType<any>
): React.ComponentType<any> => {
  class WrapperComponent extends React.Component<InjectedProps> {
    goToPrevChapter = () => {
      if (this.props.userInterface.handleEvents === false) return
      this.props.handleChapterNavigation(-1)
    }

    goToNextChapter = () => {
      if (this.props.userInterface.handleEvents === false) return
      this.props.handleChapterNavigation(1)
    }

    goToPrevPage = () => {
      if (this.props.userInterface.handleEvents === false) return
      this.props.userInterfaceActions.enablePageTransitions()
      this.props.handlePageNavigation(-1)
    }

    goToNextPage = () => {
      if (this.props.userInterface.handleEvents === false) return
      this.props.userInterfaceActions.enablePageTransitions()
      this.props.handlePageNavigation(1)
    }

    render() {
      return (
        <WrappedComponent
          goToPrevChapter={this.goToPrevChapter}
          goToNextChapter={this.goToNextChapter}
          goToPrevPage={this.goToPrevPage}
          goToNextPage={this.goToNextPage}
          {...this.props}
        />
      )
    }
  }

  return connect(
    ({ userInterface }: RootState) => ({ userInterface }),
    (dispatch: AppDispatch) => ({
      userInterfaceActions: bindActionCreators(userInterfaceActions, dispatch),
    })
  )(WrapperComponent)
}

export default withNavigationActions
