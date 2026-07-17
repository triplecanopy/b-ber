// Shallow object equality for `useStore` selectors that derive a *new* object
// each call (e.g. picking several fields from a slice). Without it
// `useSyncExternalStoreWithSelector` would treat every snapshot as changed and
// loop (STATE-MIGRATION-PLAN "Gotchas"). Mirrors react-redux's `shallowEqual`.
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  ) {
    return false
  }

  const keysA = Object.keys(a as Record<string, unknown>)
  const keysB = Object.keys(b as Record<string, unknown>)
  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (
      !Object.hasOwn(b as Record<string, unknown>, key) ||
      !Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    ) {
      return false
    }
  }
  return true
}
