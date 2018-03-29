import util from 'util'

function printNotices(type, task = 'b-ber') {
    const prop = task ? `task${type[0].toUpperCase()}${type.slice(1)}` : type
    const notices = this[type].slice(this[prop] * -1)
    const leader = type === 'warnings' ? 'warn' : 'err'
    const header = util.format.apply(util, ['[%s] emitted [%d] %s', task, notices.length, type])
    const color = 'black'
    // const color = type === 'warnings' ? 'yellow' : 'red'

    if (this.logLevel > 2) console.log('%s%s', this.indent(), this.decorate(header, color))

    if (this.logLevel > 3) {

        this.incrementIndent()
        notices.forEach(_ => {
            const stack = _.stack.split('\n').slice(2).map(s => s.replace(/^\s+/, this.indent())).join('\n')

            console.log('%s%s %s', this.indent(), this.decorate(leader, color), this.decorate(_.message, 'cyan'))
            console.log('%s', stack)
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
