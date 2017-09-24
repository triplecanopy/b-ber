import util from 'util'

export function warn() {

    if (this.logLevel < 2) { return }

    const args = Array.prototype.slice.call(arguments, 0)

    let message = this.composeMessage(args)
    if (args[0] instanceof Error) {
        message = this.composeMessage([args[0].message])
    } else {
        message = this.composeMessage(args)
    }

    const counter = this.counter()
    const context = this.getContext()
    const { stack } = new Error()

    const warningText = 'WARN'
    const warn = this.decorate(warningText, 'yellow', 'underline')
    const offset = counter.length + warningText.length + 3 // ?


    const formatted = util.format.apply(util, ['%s %s', counter, warn, this.indent().substring(offset), message])

    this.taskWarnings += 1
    this.warnings.push({
        stack,
        message,
        formatted,
    })

    console.log(formatted)

}
