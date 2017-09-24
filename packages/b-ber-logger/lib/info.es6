// import util from 'util'

export function info() {

    if (this.logLevel === 0) { return }

    const args = Array.prototype.slice.call(arguments, 0)

    const counter = this.counter()
    const context = this.getContext()
    const message = this.decorate(this.composeMessage(args), 'cyan')

    let prefix = ''
    if (context) {
        if (this.command === 'build') { // TODO: handle this better; don't show first line whitespace on standalone command
            console.log()
        }
        this.decrementIndent()
        prefix += `${this.indent()}${this.decorate(`Using [${context}]`, 'cyan')}\n`
        this.incrementIndent()
    }

    prefix += `${counter}${this.indent().substring(counter.length)}`

    console.log(`${prefix}${message}`)

}
