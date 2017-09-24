"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.notify = notify;
function notify(event, data) {
    this[event].call(this, data);
}