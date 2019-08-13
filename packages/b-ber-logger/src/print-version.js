/* eslint-disable import/prefer-default-export */

import util from 'util'

export function printVersion(version) {
    const message = util.format.call(
        util,
        '%s%s %s %s',
        this.indent(),
        this.decorate('b-ber', 'whiteBright', 'bgBlack'),
        this.decorate('version'),
        this.decorate(version, 'blueBright')
    )

    process.stdout.write(message)
    this.newLine()
}
