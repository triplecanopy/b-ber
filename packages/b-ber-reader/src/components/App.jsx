import React, { Component } from 'react'
import find from 'lodash/find'
import { Reader, Library } from '.'
import { Request, Url } from '../helpers'
import history from '../lib/History'

class App extends Component {
  static defaultProps = {
    uiOptions: {
      navigation: {
        // eslint-disable-next-line camelcase
        header_icons: {
          home: true,
          toc: true,
          downloads: true,
          info: true,
        },
        // eslint-disable-next-line camelcase
        footer_icons: {
          chapter: true,
          page: true,
        },
      },
    },
  }

  constructor(props) {
    super(props)

    this.state = {
      books: props.books || [],
      bookURL: props.bookURL || null,
      // defaultBookURL: props.bookURL || null,
      // basePath: props.basePath || '/',
      downloads: props.downloads || [],
      uiOptions: props.uiOptions || {}, // eslint-disable-line react/no-unused-state
      cache: typeof props.cache !== 'undefined' ? props.cache : true,
      pathname: '',
      search: '',
      // loadRemoteLibrary:
      //   typeof props.loadRemoteLibrary !== 'undefined'
      //     ? props.loadRemoteLibrary
      //     : /^localhost/.test(window.location.host),
    }
  }

  async UNSAFE_componentWillMount() {
    const { data: books } = await Request.getManifest()
    const params = new URLSearchParams(window.location)

    const search = params.get('search')
    const title = params.get('pathname').slice(1)
    const url = this.props.bookURL

    // TODO if not title && not url ...
    const pred = title ? { title } : { url }
    const book = find(books, pred)
    const bookURL = book ? book.url : null

    this.bindHistoryListener()
    this.setState({ books, bookURL, search })
  }

  bindHistoryListener = () => {
    history.listen((location /*, action */) => {
      const { pathname, search } = location

      if (location.state?.bookURL === null) {
        history.go(pathname) // Reload
        return
      }

      this.setState({ pathname, search })
    })
  }

  handleClick = ({ title, url: bookURL }) => {
    history.push(Url.slug(title)) // Set pathname
    this.setState({ bookURL }) // Tell the reader to load data from bookURL
  }

  render() {
    const { books, bookURL, pathname, search, downloads, cache } = this.state
    return (
      <React.Fragment>
        {bookURL ? (
          <Reader
            pathname={pathname}
            search={search}
            bookURL={bookURL}
            downloads={downloads}
            cache={cache}
            {...this.props}
          />
        ) : (
          <Library books={books} handleClick={this.handleClick} />
        )}
      </React.Fragment>
    )
  }
}

export default App
