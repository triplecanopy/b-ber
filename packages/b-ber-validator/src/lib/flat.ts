// Polyfill Array.flat for Node < 11

export function flat(arr: unknown[], d = 1): unknown[] {
  if ('flat' in []) return arr.flat(d)

  return d > 0
    ? arr.reduce<unknown[]>(
        (acc, val) => acc.concat(Array.isArray(val) ? flat(val, d - 1) : val),
        []
      )
    : arr.slice()
}
