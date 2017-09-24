import util from 'util'

export function error() {
    const args = Array.prototype.slice.call(arguments, 0)
    const errCode = 1


    let message
    let stack

    if (args[0] instanceof Error) {
        message = this.composeMessage([args[0].message]);
        ({ stack } = args[0])
    } else {
        message = this.composeMessage(args);
        ({ stack } = new Error())
    }

    const counter = this.counter()
    const context = this.getContext()

    const errorText = 'ERROR'
    const error = this.decorate(errorText, 'red', 'underline')
    const offset = counter.length + errorText.length + 3


    const formatted = util.format.apply(util, ['%s %s', counter, error, this.indent().substring(offset), message])

    this.taskErrors += 1
    this.errors.push({
        stack,
        message,
        formatted,
    })

    console.log(formatted)
    console.log()
    console.log(stack)
    console.log()
    console.log(this.decorate(`b-ber exited with code ${errCode}`, 'red'))
    process.exit(errCode)
}
