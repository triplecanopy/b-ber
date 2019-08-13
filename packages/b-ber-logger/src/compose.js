/* eslint-disable import/prefer-default-export */

import util from 'util'

export function composeMessage(args) {
    const message = util.format
        .call(util, ...args)
        .split('\n')
        .map(a => a.trim())
        .join(`\n${' '.repeat(6)}`)
        .replace(/\{(\d+)\}/g, (_, d) => this.decorate(String(this.floatFormat(d)), 'blueBright'))
        .replace(/\[([^\]]+)\]/g, (_, s) => this.decorate(s, 'blueBright'))

    return message
}
