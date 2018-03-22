/// <reference path='node_modules/@types/node/index.d.ts' />

import {EventEmitter} from 'events'
import {isPlainObject, pick} from 'lodash'

type Callable<T> = (...args: T[]) => any

interface OptionsInterface {
    maxCalls      : number
    timeLimit     : number
    [key: string] : number
}

interface ProcInterface {
    readonly id   : string
    readonly func : Callable<any>
    args          : any[]
    [key: string] : string | Callable<any> | any[]
}

interface DriveEntry {
    readonly id       : string
    readonly kind     : string
    readonly name     : string
    readonly mimeType : MimeType
    [key: string]     : string | MimeType
}

class Batch extends EventEmitter {
    [key: string]: string | number | Callable<any> | ReadonlyArray<any>

    private maxCalls  : number // max calls in given time constraint
    private timeLimit : number // time-lmiit to make to make `maxCalls`

    static defaults: { [key: string]: number } = { maxCalls: 10, timeLimit: 1000 }


    private _current : number = 0 // keep track of how many calls we've made
    private _value   : ReadonlyArray<any> = [] // responses are passed through the callback chain. the array can be accessed on the final call
    private _queue   : ReadonlyArray<ProcInterface> = [] // functions in queue

    constructor(options: OptionsInterface = <OptionsInterface>{}) {
        super()
        const _defaults = <OptionsInterface>this._defaults()
        const _options: { [key: string]: any } = pick(typeof options === undefined ? {} : { ...options }, Object.keys(_defaults))
        const settings: { [key: string]: number } = { ..._defaults, ..._options }
        Object.keys(settings).forEach(_ => this[_] = settings[_])
    }

    private _noop(): void {
    }

    private _id(): string {
        return String(Math.random()).slice(2)
    }

    private _defaults(): object {
        return Batch.defaults
    }

    private _addToQueue(proc: ProcInterface): void {
        this._queue = [...this._queue, proc]
    }

    private removeFromQueue(proc: ProcInterface): void {
        const { id } = proc
        this._queue = [...this._queue.filter(_ => _.id === id)]
    }

    private _continue(proc: ProcInterface, reset: boolean): void {
        if (reset) {
            this._current = 0
        }
        this.removeFromQueue(proc)
        this.processQueue()
    }

    // public
    public processQueue(): void {
        this._current += 1
        const proc = this._queue[0]

        if (!proc) {
            // console.log('nothing to process!')
            this.emit('end', null, this._value)
            return
        }

        let callback: Callable<any> = this._noop
        if (typeof proc.args[proc.args.length - 1] === 'function') {
            callback = proc.args.pop()
        }

        proc.func.apply(proc.func, [
            ...proc.args,
            (err: null | Error, value: any): any => {
                this._value = [...this._value, value]
                callback.apply(proc.func, [err, value])
            }
        ])

        if (this._current === this.maxCalls) {
            setTimeout(() => {
                this._continue(proc, true)
            }, this.timeLimit)
        } else {
            this._continue(proc, false)
        }
    }

    public add<T>(func: Callable<T>, ...args: T[]): void {
        const id = this._id()
        this._addToQueue({ id, func, args })
    }

    public addDriveItem(func: Callable<DriveEntry>, item: DriveEntry): void {
        const { id } = item
        this._addToQueue({ id, func, args: [item] })
    }
}

export default Batch
