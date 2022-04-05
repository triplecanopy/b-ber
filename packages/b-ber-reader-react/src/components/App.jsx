import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import find from 'lodash/find'
import { Reader, Library } from '.'
import { Request, Url } from '../helpers'
import * as readerSettingsActions from '../actions/reader-settings'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pathname: '',
      search: '',
    }
  }

  async UNSAFE_componentWillMount() {
    const params = new URLSearchParams(window.location)
    const search = params.get('search')
    const pathname = params.get('pathname').slice(1)

    const { manifestURL } = this.props.readerSettings
    let { paramKeys, bookURL, projectURL } = this.props.readerSettings
    let books = []

    if (manifestURL && bookURL) {
      throw new Error(
        'Multiple endpoints. Specify either `manifestURL` or `bookURL`'
      )
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
        this.props.readerSettingsActions.updateBookURL(bookURL)
      } catch (err) {
        console.error('Error loading Webpub manifest', err)
      }
    }

    // Path from which to load api/books.json
    if (!projectURL) {
      projectURL = new URL(bookURL).origin
    }

    try {
      const resp = await Request.getBooks(projectURL)
      books = resp.data
    } catch (err) {
      console.warn('Could not load books from API', err)
    }

    // TODO if not title && not url ...
    const pred = pathname ? { title: pathname } : { url: bookURL }
    const book = find(books, pred)

    bookURL = book ? book.url : ''

    // Get overridden query string paremeter keys
    paramKeys = {
      ...this.state.paramKeys,
      ...(paramKeys || {}),
    }

    this.setState({ search, pathname }, () => {
      this.props.readerSettingsActions.updateBooks(books)
      this.props.readerSettingsActions.updateBookURL(bookURL)
      this.props.readerSettingsActions.updateProjectURL(projectURL)
      this.props.readerSettingsActions.updateQueryParameterKeys(paramKeys)
    })
  }

  handleClick = ({ title, url: bookURL }) => {
    const pathname = Url.slug(title)
    this.setState({ pathname })

    // Tell the reader to load data from bookURL
    this.props.readerSettingsActions.updateBookURL(bookURL)
  }

  render() {
    const { pathname, search } = this.state
    const { bookURL, books, ...rest } = this.props.readerSettings

    if (!bookURL) {
      return <Library books={books} handleClick={this.handleClick} />
    }

    // TODO shouldn't be passing in readerSettings as a spread here
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Reader pathname={pathname} search={search} bookURL={bookURL} {...rest} />
    )
  }
}

const mapStateToProps = ({ readerSettings }) => ({
  readerSettings,
})

const mapDispatchToProps = dispatch => ({
  readerSettingsActions: bindActionCreators(readerSettingsActions, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(App)
