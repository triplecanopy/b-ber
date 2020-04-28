import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import find from 'lodash/find'
import { Reader, Library } from '.'
import { Request, Url } from '../helpers'
import history from '../lib/History'
import * as readerSettingsActions from '../actions/reader-settings'

class App extends Component {
  state = {
    pathname: '',
    search: '',
  }

  async UNSAFE_componentWillMount() {
    let books = []
    try {
      const resp = await Request.getManifest()
      books = resp.data
    } catch (err) {
      console.error('Could not load manifest from API', err)
    }

    const params = new URLSearchParams(window.location)
    const search = params.get('search')
    const title = params.get('pathname').slice(1)

    let { bookURL, projectURL } = this.props.readerSettings
    if (!projectURL) projectURL = '' // Path from which to load api/books.json

    // TODO if not title && not url ...
    const pred = title ? { title } : { url: bookURL }
    const book = find(books, pred)

    bookURL = book ? book.url : ''

    this.bindHistoryListener()

    this.setState({ search }, () => {
      this.props.readerSettingsActions.updateBooks(books)
      this.props.readerSettingsActions.updateBookURL(bookURL)
      this.props.readerSettingsActions.updateProjectURL(projectURL)
    })
  }

  bindHistoryListener = () => {
    history.listen(location => {
      const { pathname, search } = location

      if (!location.state?.bookURL) {
        this.props.readerSettingsActions.updateBookURL('')
        return
      }

      this.setState({ pathname, search })
    })
  }

  handleClick = ({ title, url: bookURL }) => {
    // Set pathname
    history.push(Url.slug(title))

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
