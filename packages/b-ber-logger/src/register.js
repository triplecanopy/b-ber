/* eslint-disable import/prefer-default-export */

import util from 'util'

export function registerSequence(state, command, sequence) {

    this.command = command

    let message = util.format.call(util,
        '%s%s %s %s',
        this.indent(),
        this.decorate('b-ber', 'whiteBright', 'bgBlack'),
        this.decorate('version', 'black'),
        this.decorate(state.version, 'magenta'),
    )

    process.stdout.write(message)
    this.newLine()

    message = util.format.call(util,
        '%s%s %s %s',
        this.indent(),
        this.decorate('b-ber', 'whiteBright', 'bgBlack'),
        this.decorate('Preparing to run', 'black'),
        this.decorate(sequence.length, 'black'),
        this.decorate(`task${sequence.length > 1 ? 's' : ''}`, 'black'),
    )

    process.stdout.write(message)
    this.newLine()
}
