import util from 'util'
import chalk from 'chalk'

export function wrap(arr, space) {
    return arr
        .reduce((acc, curr) => {
            const a = acc.split('\n')
            const l = a[a.length - 1].length
            return acc.concat(
                l > this.consoleWidth ? `\n${space}${curr}, ` : `${curr}, `,
            )
        }, '')
        .slice(0, -2)
}

export function floatFormat(n) {
    const num = parseInt(n, 10)
    const len = String(num).length - 1
    const pow = Math.floor(len / 3)

    const pows = ['B', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb']

    const fmt = ((num / 1000) ** pow).toFixed(2)
    const str = `${fmt} ${pows[pow]}`

    return str
}

export function decorate(_args, ...props) {
    const args = _args && _args.constructor === Array ? _args : [_args]

    let message = util.format.call(util, ...args)

    if (this.boringOutput === false) {
        for (let i = props.length - 1; i >= 0; i--) {
            message = chalk[props[i]](message)
        }
    }

    return message
}
