import { messagesTypes } from '../constants'

export default class PageEvent {
    constructor({ spreadIndex, lastIndex, firstPage, lastPage }) {
        this.origin = window.location.origin
        this.type = messagesTypes.PAGINATION_EVENT
        this.spreadIndex = spreadIndex
        this.lastIndex = lastIndex
        this.firstPage = firstPage
        this.lastPage = lastPage
    }
}
