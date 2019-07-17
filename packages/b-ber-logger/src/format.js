import util from 'util'
import chalk from 'chalk'
import isArray from 'lodash/isArray'

export function wrap(arr, space) {
    return arr
        .reduce((acc, curr) => {
            const a = acc.split('\n')
            const l = a[a.length - 1].length
            return acc.concat(l > this.consoleWidth ? `\n${space}${curr}, ` : `${curr}, `)
        }, '')
        .slice(0, -2)
}

export function floatFormat(n) {
    const pows = {
        1: { text: 'B', pow: 0 },
        2: { text: 'B', pow: 0 },
        3: { text: 'B', pow: 0 },
        4: { text: 'Kb', pow: 3 },
        5: { text: 'Kb', pow: 3 },
        6: { text: 'Kb', pow: 3 },
        7: { text: 'Mb', pow: 6 },
        8: { text: 'Mb', pow: 6 },
        9: { text: 'Mb', pow: 6 },
        10: { text: 'Gb', pow: 9 },
        11: { text: 'Gb', pow: 9 },
    }

    const len = String(n).length
    const fmt = (n / Number(`1e${pows[len].pow}`)).toFixed(2)
    const str = `${fmt} ${pows[len].text}`

    return str
}

export function decorate(_args, ...props) {
    const args = _args && isArray(_args) ? _args : [_args]

    let message = util.format.call(util, ...args)

    if (this.boringOutput === false) {
        for (let i = props.length - 1; i >= 0; i--) {
            if (chalk[props[i]]) {
                message = chalk[props[i]](message)
            } else {
                message = chalk(message)
            }
        }
    }

    return message
}
