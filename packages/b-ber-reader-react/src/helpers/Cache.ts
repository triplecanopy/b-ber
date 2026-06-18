import * as Asset from './Asset'
import * as Storage from './Storage'

export const localStorageKey = 'bber_cache'

// Cached entries are loosely typed — callers narrow. TODO: type this
export function get(url: string): any {
  const hash = Asset.createHash(url)
  const storage = Storage.get(localStorageKey)

  return storage && storage[hash] ? storage[hash] : null
}

export function set(url: string, data: unknown): void {
  const hash = Asset.createHash(url)
  const storage = Storage.get(localStorageKey)

  if (storage) {
    storage[hash] = { data }
    Storage.set(storage, localStorageKey)
  }
}

export function clear(): void {
  Storage.clear(localStorageKey)
}
