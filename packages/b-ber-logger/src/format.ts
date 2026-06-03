import chalk from 'chalk'
import util from 'util'

export function wrap(this: any, arr: string[], space: string): string {
  return arr
    .reduce((acc: string, curr: string) => {
      const a = acc.split('\n')
      const l = a[a.length - 1].length
      return acc.concat(
        l > this.consoleWidth ? `\n${space}${curr}, ` : `${curr}, `
      )
    }, '')
    .slice(0, -2)
}

export function floatFormat(_n: unknown): string {
  const n = Number(_n)
  const pows: Record<number, { text: string; pow: number }> = {
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

export function decorate(
  this: any,
  _args: unknown,
  ...props: string[]
): string {
  const args = _args && Array.isArray(_args) ? _args : [_args]

  let message = util.format.call(util, ...args)

  if (this.boringOutput === false) {
    for (let i = props.length - 1; i >= 0; i--) {
      const chalkFn = (
        chalk as unknown as Record<string, ((s: string) => string) | undefined>
      )[props[i]]
      if (chalkFn) {
        message = chalkFn(message)
      } else {
        message = chalk`${message}`
      }
    }
  }

  return message
}
