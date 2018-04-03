import React, {Component} from 'react'
import find from 'lodash/find'
import {Reader, Library} from './'
import {Request, Url} from '../helpers'
import history from '../lib/History'

class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            books: [],
            bookURL: null,
        }

        this.handleClick = this.handleClick.bind(this)
        this.bindHistoryListener = this.bindHistoryListener.bind(this)
        this.goToBookURL = this.goToBookURL.bind(this)
    }
    componentDidMount() {
        this.bindHistoryListener()
        Request.getManifest()
            .then(({data}) => this.setState({books: data}))
            .then(_ => this.goToBookURL(history.location))
    }
    goToBookURL(location) {
        if (!location || !location.state) {
            console.log('No history.location or history.location.state')
            history.push('/', {bookURL: null})
            return
        }

        const {books} = this.state
        let {bookURL} = location.state

        if (!find(books, {url: bookURL})) bookURL = null

        this.setState({bookURL})
    }
    bindHistoryListener() {
        console.log(history)
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
        const {books, bookURL} = this.state
        return (
            <div>
                {bookURL
                    ? <Reader bookURL={bookURL} />
                    : <Library books={books} handleClick={this.handleClick} />}
            </div>
        )
    }
}

export default App
