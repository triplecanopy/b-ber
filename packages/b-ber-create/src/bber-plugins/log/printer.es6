import util from 'util'

function __printNotices(type, task = 'b-ber') { // TODO: clean up
    const prop = task ? `task${type[0].toUpperCase()}${type.slice(1)}` : type
    const notices = this[type].slice(this[prop] * -1)
    const leader = type === 'warnings' ? 'WARN' : 'ERROR'
    const header = util.format.apply(util, ['[%s] emitted [%d] %s', task, notices.length, type])
    const color = type === 'warnings' ? 'yellow' : 'red'

    console.log('%s%s', this.indent(), this.decorate(header, color, 'underline'))

    this.incrementIndent()
    notices.forEach((_) => {

        // const stack = _.stack.split('\n').slice(2).map(s => s.replace(/^\s+/, ''))[0]//.join('\n')
        const stack = _.stack.split('\n').slice(2).map(s => s.replace(/^\s+/, this.indent())).join('\n')

        console.log('%s%s %s', this.indent(), this.decorate(leader, color, 'underline'), this.decorate(_.message, 'cyan'))
        console.log('%s', stack)
        console.log()
    })
    this.decrementIndent()
}

export function printWarnings(task) {
    __printNotices.call(this, 'warnings', task)
}
export function printErrors(task) {
    __printNotices.call(this, 'errors', task)
}
