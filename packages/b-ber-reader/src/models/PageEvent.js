import { messagesTypes } from '../constants'

export default class PageEvent {
    constructor({ spreadIndex, lastSpreadIndex, firstChapter, lastChapter, firstSpread, lastSpread, spreadDelta }) {
        this.origin = window.location.origin
        this.type = messagesTypes.PAGINATION_EVENT
        this.spreadIndex = spreadIndex
        this.lastSpreadIndex = lastSpreadIndex
        this.firstChapter = firstChapter
        this.lastChapter = lastChapter
        this.firstSpread = firstSpread
        this.lastSpread = lastSpread
        this.spreadDelta = spreadDelta
    }
}
