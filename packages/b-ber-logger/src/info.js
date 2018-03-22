export function info(...args) {

    if (this.logLevel < 3) return

    const counter = this.counter()
    // const context = this.getContext()
    const message = this.decorate(this.composeMessage(args), 'black')

    let prefix = ''
    // if (context) {
    //     this.decrementIndent()
    //     console.log(this.indent() + this.decorate(context, 'magenta'))
    //     this.incrementIndent()
    // }

    prefix += this.decorate('b-ber', 'white', 'bgBlack')
    prefix += ' '
    prefix += this.decorate('info', 'green')
    prefix += ' '
    prefix += counter
    prefix += ' '

    if (this.logLevel < 4) return

    console.log(`${prefix}${message}`)

}
