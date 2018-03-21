/* eslint-disable import/prefer-default-export */

export function registerSequence(store, command, commanders, sequences) {

    this.command = command
    if (command !== 'build') { return } // TODO: should handle this better when showing `fail`

    if (this.logLevel < 3) { return }

    const { sequence } = store

    console.log()
    console.log(`%sStarting [%s]`, this.indent(), command)

    this.incrementIndent()

    console.log(`%sPreparing to run [%d] tasks`, this.indent(), sequence.length)
    console.log(`%sRunning the following tasks`, this.indent())
    console.log()

    if (Object.keys(commanders).length) {
        const cmds = Object.keys(commanders).filter(_ => commanders[_])
        cmds.forEach(_ => {
            console.log(`${this.indent()}${command}:${_}`)
            this.incrementIndent()
            console.log(`${this.indent()}${this.wrap(sequences[_], this.indent())}`)
            this.decrementIndent()
            console.log()
        })

    } else {
        console.log(`${this.indent()}${this.wrap(sequence, this.indent())}`)
    }


}
