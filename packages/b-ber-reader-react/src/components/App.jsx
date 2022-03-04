import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import find from 'lodash/find'
import { Reader, Library } from '.'
import { Request, Url } from '../helpers'
import * as readerSettingsActions from '../actions/reader-settings'

class App extends Component {
  // eslint-disable-next-line react/state-in-constructor
  state = {
    pathname: '',
    search: '',
  }

  async UNSAFE_componentWillMount() {
    const params = new URLSearchParams(window.location)
    const search = params.get('search')
    const pathname = params.get('pathname').slice(1)

    let { bookURL, projectURL } = this.props.readerSettings
    if (!projectURL) projectURL = '' // Path from which to load api/books.json

    let books = []
    try {
      const resp = await Request.getManifest(projectURL)
      books = resp.data
    } catch (err) {
      console.error('Could not load manifest from API', err)
    }

    // TODO if not title && not url ...
    const pred = pathname ? { title: pathname } : { url: bookURL }
    const book = find(books, pred)

    bookURL = book ? book.url : ''

    this.setState({ search, pathname }, () => {
      this.props.readerSettingsActions.updateBooks(books)
      this.props.readerSettingsActions.updateBookURL(bookURL)
      this.props.readerSettingsActions.updateProjectURL(projectURL)
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
