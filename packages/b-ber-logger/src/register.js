/* eslint-disable import/prefer-default-export */

export function registerSequence(state, command, commanders, sequences) {

    this.command = command
    if (command !== 'build') return // TODO: should handle this better when showing `fail`

    if (this.logLevel < 3) return

    const {sequence} = state

    console.log()
    console.log(this.decorate([`%sStarting [%s]`, this.indent(), command], 'cyan'))

    this.incrementIndent()

    console.log(`%sPreparing to run [%d] tasks`, this.indent(), sequence.length)
    console.log(`%sRunning the following tasks`, this.indent())
    console.log()

    if (Object.keys(commanders).length) {
        const cmds = Object.keys(commanders).filter(a => commanders[a])
        cmds.forEach(a => {
            console.log(`${this.indent()}${command}:${a}`)
            this.incrementIndent()
            console.log(`${this.indent()}${this.wrap(sequences[a], this.indent())}`)
            this.decrementIndent()
            console.log()
        })

    } else {
        console.log(`${this.indent()}${this.wrap(sequence, this.indent())}`)
    }


}
