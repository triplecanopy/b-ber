// Polyfill Array.flat for Node < 11

export function flat(arr: any[], d = 1): any[] {
  if ('flat' in []) return arr.flat(d)

  return d > 0
    ? arr.reduce(
        (acc, val) => acc.concat(Array.isArray(val) ? flat(val, d - 1) : val),
        []
      )
    : arr.slice()
}
