import React, {Component} from 'react'
import find from 'lodash/find'
import {Reader, Library} from '.'
import {Request, Url} from '../helpers'
import history from '../lib/History'

class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            books: props.books || [],
            bookURL: props.bookURL || null,
            defaultBookURL: props.bookURL || null,
            basePath: props.basePath || '/',
            downloads: props.downloads || [],
            uiOptions: props.uiOptions || {},
            loadRemoteLibrary: typeof props.loadRemoteLibrary !== 'undefined' ? props.loadRemoteLibrary : /^localhost/.test(window.location.host),
        }

        this.handleClick = this.handleClick.bind(this)
        this.bindHistoryListener = this.bindHistoryListener.bind(this)
        this.goToBookURL = this.goToBookURL.bind(this)
    }
    componentDidMount() {
        this.bindHistoryListener()

        const {loadRemoteLibrary} = this.state
        if (!loadRemoteLibrary) return this.goToBookURL(history.location)

        Request.getManifest()
            .then(({data}) => this.setState({books: [...this.state.books, ...data]}))
            .then(_ => this.goToBookURL(history.location))

    }
    goToBookURL(location) {
        const {defaultBookURL, basePath} = this.state

        if (!location || !location.state) {
            console.log('No history.location or history.location.state')
            history.push(Url.createPath(basePath), {bookURL: defaultBookURL})
            return
        }

        const {books} = this.state
        let {bookURL} = location.state

        if (!find(books, {url: bookURL})) bookURL = defaultBookURL

        this.setState({bookURL})
    }
    bindHistoryListener() {
        console.log('History:', history)
        history.listen((location/* , action */) => {
            if (!location.state) {
                console.warn('No history.location.state')
                console.warn('Location:', location)
                return
            }

            this.goToBookURL(location)
        })
    }
    handleClick({title, url}) { // eslint-disable-line class-methods-use-this
        const bookURL = url
        history.push(Url.slug(title), {bookURL})
    }

    render() {
        const {books, bookURL, downloads} = this.state
        return (
            <div>
                {bookURL
                    ? <Reader
                        bookURL={bookURL}
                        downloads={downloads}
                        {...this.props}
                    />
                    : <Library
                        books={books}
                        handleClick={this.handleClick}
                    />}
            </div>
        )
    }
}

export default App
