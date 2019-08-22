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
            search: '',
            loadRemoteLibrary:
                typeof props.loadRemoteLibrary !== 'undefined'
                    ? props.loadRemoteLibrary
                    : /^localhost/.test(window.location.host),
        }

        this.handleClick = this.handleClick.bind(this)
        this.bindHistoryListener = this.bindHistoryListener.bind(this)
        this.goToBookURL = this.goToBookURL.bind(this)
    }

    componentDidMount() {
        this.bindHistoryListener()

        const { loadRemoteLibrary } = this.state
        if (!loadRemoteLibrary) return this.goToBookURL(history.location)

        Request.getManifest()
            .then(({ data }) => this.setState({ books: [...this.state.books, ...data] }))
            .then(() => this.goToBookURL(history.location))
    }

    goToBookURL(location) {
        const { defaultBookURL, basePath, useBrowserHistory } = this.state

        if (!location || !location.state) {
            console.log('No history.location or history.location.state')
            return useBrowserHistory ? history.push(Url.createPath(basePath), { bookURL: defaultBookURL }) : null
        }

        const { books } = this.state
        let { bookURL } = location.state

        if (!find(books, { url: bookURL })) bookURL = defaultBookURL

        this.setState({ bookURL })
    }

    // eslint-disable-next-line
    bindHistoryListener() {
        const { useBrowserHistory } = this.state
        history.listen((location /* , action */) => {
            const { search } = location
            if (!location.state) {
                if (useBrowserHistory && history.length) history.goBack()
                return
            }

            this.goToBookURL(location)
            this.setState({ search: search.slice(1) })
        })
    }

    handleClick({ title, url }) {
        return this.state.useBrowserHistory
            ? history.push(Url.slug(title), { bookURL: url })
            : this.setState({ bookURL: url })
    }

    render() {
        const { books, bookURL, search, downloads, useBrowserHistory, cache } = this.state
        console.log('this.state', this.state)
        return (
            <div>
                {bookURL ? (
                    <Reader
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
            </div>
        )
    }
}

export default App
