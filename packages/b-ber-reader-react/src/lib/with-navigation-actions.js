/* eslint-disable react/jsx-props-no-spreading */

import React from 'react'

const withNavigationActions = WrappedComponent =>
  class WrapperComponent extends React.Component {
    goToPrevChapter = () => {
      if (this.props.handleEvents === false) return
      this.props.handleChapterNavigation(-1)
    }

    goToNextChapter = () => {
      if (this.props.handleEvents === false) return
      this.props.handleChapterNavigation(1)
    }

    goToPrevPage = () => {
      if (this.props.handleEvents === false) return
      this.props.enablePageTransitions()
      this.props.handlePageNavigation(-1)
    }

    goToNextPage = () => {
      if (this.props.handleEvents === false) return
      this.props.enablePageTransitions()
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

export default withNavigationActions
