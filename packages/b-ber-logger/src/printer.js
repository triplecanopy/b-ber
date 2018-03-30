import util from 'util'

function printNotices(type, task = 'b-ber') {
    const prop = task ? `task${type[0].toUpperCase()}${type.slice(1)}` : type
    const notices = this[type].slice(this[prop] * -1)
    const leader = type === 'warnings' ? 'WARN' : 'ERR!'
    const color = type === 'warnings' ? 'bgYellowBright' : 'bgRed'

    const message = util.format.call(util,
        '%s%s %s task %s - %s %s',
        this.indent(),
        this.decorate('b-ber', 'whiteBright', 'bgBlack'),
        this.decorate(leader, color),
        this.decorate(task, 'black'),
        this.decorate(notices.length, 'black'),
        this.decorate(type, 'black'),
    )

    if (this.logLevel > 2) {
        process.stdout.write(message)
        process.stdout.write('\n')
    }

    if (this.logLevel > 3) {

        this.incrementIndent()
        notices.forEach(notice => {
            console.log('%s%s %s', this.indent(), this.decorate(leader, color), this.decorate(notice.message, 'cyan'))
            console.log('%s', notice)
        })
        this.decrementIndent()
    }

}

export function printWarnings(task) {
    printNotices.call(this, 'warnings', task)
}
export function printErrors(task) {
    printNotices.call(this, 'errors', task)
}
