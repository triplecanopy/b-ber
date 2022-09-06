import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import find from 'lodash/find'
import { Reader } from '.'
import Request from '../helpers/Request'
import * as readerSettingsActions from '../actions/reader-settings'
import * as readerLocationActions from '../actions/reader-location'

class App extends Component {
  async UNSAFE_componentWillMount() {
    const { manifestURL, disableBodyStyles } = this.props.readerSettings
    let { bookURL, projectURL } = this.props.readerSettings
    let books = []

    if (manifestURL && bookURL) {
      console.error(
        'Multiple endpoints. Specify either `manifestURL` or `bookURL`'
      )
    }

    if (disableBodyStyles !== true) {
      // Add styles to body element in case the reader is running stand-alone

      // Prevent font size change on mobile landscape
      document.body.style['-webkit-text-size-adjust'] = 'none'
      document.body.style['touch-action'] = 'manipulation'
      document.body.style.margin = '0'
      document.body.style.padding = '0'
    }

    if (manifestURL) {
      // Find the path to the books root directory. Assuming that the content.opf
      // is in root/OPS/, we can navigate back from there. Support for loading
      // books from a webpub manifest should be implemented properly in the future.
      // Books with a different full-path specified in the container.xml will of
      // course fail
      try {
        const resp = await Request.get(manifestURL)
        const { data } = resp

        const { href: opfURL } = data.resources.find(
          res => res.type === 'application/oebps-package+xml'
        )

        bookURL = opfURL
          .split('/')
          .slice(0, -2)
          .join('/')

        // Must be called before state is set
        this.props.readerSettingsActions.updateSettings({ bookURL })

        // Set the projectURL if not set to prevent 404 to /api/books.json
        if (!projectURL) {
          projectURL = manifestURL.slice(0, manifestURL.lastIndexOf('/'))
        }
      } catch (err) {
        console.error('Error loading Webpub manifest', err)
      }
    }

    if (bookURL && !projectURL) {
      // Path from which to load api/books.json
      projectURL = bookURL
        .split('/')
        .slice(0, -2)
        .join('/')
    }

    try {
      const resp = await Request.getBooks(projectURL)
      books = resp.data
    } catch (err) {
      console.warn('Could not load books from API', err)
    }

    // console.log('---- books', books)
    // console.log('---- bookURL', bookURL)
    // console.log('---- projectURL', projectURL)

    // This is a bit confusing since an array of books can be returned, but the
    // settings for a single book need to be applied. This will need to be addressed
    // to either remove or re-enable the library functionality
    // There should also be a better way of syncing up the ID that exists in the book
    // other than just testing against the directory path, but since b-ber uses the
    // same value for both.
    const id = bookURL
      .split('/')
      .filter(Boolean)
      .pop()
    const book = find(books, { id })
    const projectConfig = {}

    // Extend projectConfig with data returned from API
    if (book) {
      projectConfig.layout = book.layout
      projectConfig.downloads = book.downloads
      projectConfig.uiOptions = book.ui_options
    }

    // projectConfig has layout set manually if it's not defined in
    // either the API data or the React component as prop. This should
    // be handled programatically
    projectConfig.layout =
      this.props.readerSettings.layout || projectConfig.layout || 'columns'

    this.props.readerSettingsActions.updateSettings({
      books,
      bookURL,
      projectURL,
      ...projectConfig,
    })

    this.props.readerLocationActions.setInitialSearchParams()
  }

  render() {
    const { searchParams } = this.props.readerLocation
    const { bookURL } = this.props.readerSettings

    if (!searchParams || !bookURL) return null

    const { style, className, ...rest } = this.props.readerSettings

    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Reader style={style} className={className} {...rest} />
    )
  }
}

const mapStateToProps = ({ readerSettings, readerLocation }) => ({
  readerSettings,
  readerLocation,
})

const mapDispatchToProps = dispatch => ({
  readerSettingsActions: bindActionCreators(readerSettingsActions, dispatch),
  readerLocationActions: bindActionCreators(readerLocationActions, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(App)
