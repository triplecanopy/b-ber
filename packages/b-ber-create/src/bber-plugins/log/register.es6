import { sequences } from 'bber-shapes/sequences'

export function registerSequence(store, command, commanders) {

    this.command = command
    if (command !== 'build') { return } // TODO: should handle this better when showing `fail`

    const { sequence } = store

    if (this.logLevel === 0) { return }

    console.log()
    console.log(`%sStarting [%s]`, this.indent(), command)

    this.incrementIndent()

    console.log(`%sPreparing to run [%d] tasks`, this.indent(), sequence.length)
    console.log(`%sRunning the following tasks`, this.indent())
    console.log()

    this.incrementIndent()

    if (Object.keys(commanders).length) {
        const cmds = Object.keys(commanders).filter(_ => commanders[_])
        cmds.forEach((_) => {
            console.log(`${this.indent()}${command}:${_}`)
            this.incrementIndent()
            console.log(`${this.indent()}${this.wrap(sequences[_], this.indent())}`)
            this.decrementIndent()
        })

    } else {
        console.log(`${this.indent()}${this.wrap(sequence, this.indent())}`)
    }


    this.decrementIndent()

}
