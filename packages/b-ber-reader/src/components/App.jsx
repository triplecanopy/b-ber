import React, { Component } from 'react'
import find from 'lodash/find'
import { Reader, Library } from '.'
import { Request, Url } from '../helpers'
import history from '../lib/History'

class App extends Component {
  static defaultProps = {
    uiOptions: {
      navigation: {
        header_icons: {
          home: true,
          toc: true,
          downloads: true,
          info: true,
        },
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
      defaultBookURL: props.bookURL || null,
      basePath: props.basePath || '/',
      downloads: props.downloads || [],
      uiOptions: props.uiOptions || {}, // eslint-disable-line react/no-unused-state
      cache: typeof props.cache !== 'undefined' ? props.cache : true,
      useBrowserHistory: props.useBrowserHistory || true,
      pathname: '',
      search: '',
      loadRemoteLibrary:
        typeof props.loadRemoteLibrary !== 'undefined'
          ? props.loadRemoteLibrary
          : /^localhost/.test(window.location.host),
    }
  }

  async componentWillMount() {
    const { data: books } = await Request.getManifest()
    const params = new URLSearchParams(window.location)

    const title = params.get('pathname').slice(1)
    const url = this.props.bookURL

    // TODO if not title && not url ...
    const pred = title ? { title } : { url }
    const book = find(books, pred)

    // console.log(pred, title)

    const search = params.get('search')
    // const book = find(books, { title })
    const bookURL = book ? book.url : null

    this.bindHistoryListener()
    // console.log('props', this.props)
    // console.log('books, bookURL, search', books, bookURL, search)

    this.setState({ books, bookURL, search })
  }

  // componentDidMount() {
  //   this.bindHistoryListener()

  //   const { loadRemoteLibrary } = this.state
  //   if (!loadRemoteLibrary) return this.goToBookURL(history.location)

  //   console.log(history)
  //   return

  //   Request.getManifest()
  //     .then(({ data }) =>
  //       this.setState({ books: [...this.state.books, ...data] })
  //     )
  //     .then(() => this.goToBookURL(history.location))
  // }

  // goToBookURL = location => {
  //   const { defaultBookURL, basePath, useBrowserHistory } = this.state

  //   if (!location || !location.state) {
  //     console.log('No history.location or history.location.state')

  //     console.log(this.props)
  //     console.log(this.state)

  //     return useBrowserHistory
  //       ? history.push(Url.createPath(basePath), { bookURL: defaultBookURL })
  //       : null
  //   }

  //   const { books } = this.state
  //   let { bookURL } = location.state

  //   if (!find(books, { url: bookURL })) bookURL = defaultBookURL

  //   this.setState({ bookURL })
  // }

  // // eslint-disable-next-line
  bindHistoryListener = () => {
    // const { useBrowserHistory } = this.state
    history.listen((location, action) => {
      //   // const { search } = location
      console.log('-- history updates', action, location)
      const { pathname, search } = location

      if (location.state?.bookURL === null) {
        console.log('---- go', pathname)

        return history.go(pathname) // Reload
      }

      // if (!location.state?.bookURL) {
      //   console.log('-- no state... refresh?')
      // }

      // if (pathname === '/') {
      //   console.log('-- reload')

      //   return history.go(pathname) // Reload
      // }

      this.setState({ pathname, search })

      //   // if (!location.state) {
      //   //   if (useBrowserHistory && history.length) history.goBack()
      //   //   return
      //   // }
      //   // this.goToBookURL(location)
      //   // this.setState({ search: search.slice(1) })
    })
  }

  handleClick = ({ title, url: bookURL }) => {
    history.push(Url.slug(title)) // Set pathname
    this.setState({ bookURL }) // Tell the reader to load data from bookURL
  }

  // handleClick = ({ title, url }) =>
  //   this.state.useBrowserHistory
  //     ? history.push(Url.slug(title), { bookURL: url })
  //     : this.setState({ bookURL: url })

  render() {
    const {
      books,
      bookURL,
      pathname,
      search,
      downloads,
      useBrowserHistory,
      cache,
    } = this.state
    return (
      <React.Fragment>
        {bookURL ? (
          <Reader
            pathname={pathname}
            search={search}
            bookURL={bookURL}
            downloads={downloads}
            useBrowserHistory={useBrowserHistory}
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
