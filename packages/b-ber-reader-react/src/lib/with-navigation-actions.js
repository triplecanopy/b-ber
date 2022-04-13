/* eslint-disable react/jsx-props-no-spreading */

import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as userInterfaceActions from '../actions/user-interface'

const withNavigationActions = WrappedComponent => {
  class WrapperComponent extends React.Component {
    goToPrevChapter = () => {
      if (this.props.userInterface.handleEvents === false) return
      this.props.handleChapterNavigation(-1)
    }

    goToNextChapter = () => {
      if (this.props.handleEvents === false) return
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
    ({ userInterface }) => ({ userInterface }),
    dispatch => ({
      userInterfaceActions: bindActionCreators(userInterfaceActions, dispatch),
    })
  )(WrapperComponent)
}

export default withNavigationActions
