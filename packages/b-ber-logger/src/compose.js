/* eslint-disable import/prefer-default-export */

import util from 'util'
// import path from 'path'

// function abbrvFilename(filename) {
//     return path.basename(path.dirname(filename)) + path.sep + path.basename(filename)
// }

export function composeMessage(args) {
    const message = util.format
        .call(util, ...args)
        .split('\n')
        .map(a => a.trim())
        .join(`\n${' '.repeat(6)}`)
        .replace(/\{(\d+)\}/g, (_, d) =>
            this.decorate(String(this.floatFormat(d)), 'magenta'),
        )
        .replace(/\[([^\]]+)\]/g, (_, s) => this.decorate(s, 'magenta'))

    return message
}
