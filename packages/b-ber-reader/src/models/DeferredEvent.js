import {messagesTypes} from '../constants'

export default class DeferredEvent {
    constructor() {
        this.type = messagesTypes.DEFERRED_EVENT
    }
}
