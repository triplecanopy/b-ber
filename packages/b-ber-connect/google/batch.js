"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const lodash_1 = require("lodash");
class Batch extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this._current = 0;
        this._value = [];
        this._queue = [];
        try {
            if (!lodash_1.isPlainObject(options) && typeof options !== undefined) {
                throw new TypeError(`Batch#constructor: Unsupported type [${typeof options}] passed to constructor`);
            }
        }
        catch (err) {
            throw err;
        }
        const _defaults = this._defaults();
        const _options = lodash_1.pick(typeof options === undefined ? {} : Object.assign({}, options), Object.keys(_defaults));
        const settings = Object.assign({}, _defaults, _options);
        Object.keys(settings).forEach(_ => this[_] = settings[_]);
    }
    _noop() {
    }
    _id() {
        return +String(Math.random()).slice(2);
    }
    _defaults() {
        return Batch.defaults;
    }
    _findProcessIndexById(id) {
        return this._queue.findIndex(_ => _.id === id);
    }
    _addToQueue(proc) {
        this._queue.push(proc);
    }
    removeFromQueue(proc) {
        const { id } = proc;
        const index = this._findProcessIndexById(id);
        if (index > -1) {
            this._queue.splice(index, 1);
        }
    }
    _continue(proc, reset) {
        if (reset) {
            this._current = 0;
        }
        this.removeFromQueue(proc);
        this.processQueue();
    }
    processQueue() {
        this._current += 1;
        const proc = this._queue[0];
        if (!proc) {
            this.emit('end', null, this._value);
            return;
        }
        let callback = this._noop;
        if (typeof proc.args[proc.args.length - 1] === 'function') {
            callback = proc.args.pop();
        }
        proc.func.apply(proc.func, [
            ...proc.args,
            (err, value) => {
                this._value = [...this._value, value];
                callback.apply(proc.func, [err, value]);
            }
        ]);
        if (this._current === this.maxCalls) {
            setTimeout(() => {
                this._continue(proc, true);
            }, this.timeLimit);
        }
        else {
            this._continue(proc, false);
        }
    }
    add(func, ...args) {
        const id = this._id();
        this._addToQueue({ id, func, args });
    }
}
Batch.defaults = { maxCalls: 10, timeLimit: 1000 };
exports.default = Batch;
