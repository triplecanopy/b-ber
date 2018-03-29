import util from 'util'

export function warn(...args) {

    if (this.logLevel < 2) return

    let message = this.composeMessage(args)
    if (args[0] instanceof Error) {
        message = this.composeMessage([args[0].message])
    } else {
        message = this.composeMessage(args)
    }

    // const counter = this.counter()
    const {stack} = new Error()

    let prefix = ''

    prefix += this.decorate('b-ber', 'white', 'bgBlack')
    prefix += ' '
    prefix += this.decorate('warn', 'black', 'bgYellowBright')
    // prefix += ' '
    // prefix += counter
    // prefix += ' '

    const formatted = util.format.apply(util, ['%s %s', prefix, message])

    this.taskWarnings += 1
    this.warnings.push({
        stack,
        message,
        formatted,
    })

    console.log(formatted)

}
