import Asset from './Asset'
import Storage from './Storage'

class Cache {
  static localStorageKey = 'bber_cache'

  // Cached entries are loosely typed — callers narrow. TODO: type this
  static get(url: string): any {
    const hash = Asset.createHash(url)
    const storage = Storage.get(Cache.localStorageKey)

    return storage && storage[hash] ? storage[hash] : null
  }

  static set(url: string, data: unknown): void {
    const hash = Asset.createHash(url)
    const storage = Storage.get(Cache.localStorageKey)

    if (storage) {
      storage[hash] = { data }
      Storage.set(storage, Cache.localStorageKey)
    }
  }

  static clear(): void {
    Storage.clear(Cache.localStorageKey)
  }
}

export default Cache
