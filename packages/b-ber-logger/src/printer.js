import util from 'util'

function printNotices(type, task = 'b-ber') {
    const notices = this[type]
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

    if (this.logLevel > 2) process.stdout.write(message)

}

export function printWarnings(task) {
    printNotices.call(this, 'warnings', task)
}
export function printErrors(task) {
    printNotices.call(this, 'errors', task)
}
