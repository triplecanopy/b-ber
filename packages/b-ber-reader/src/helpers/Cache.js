import { Asset, Storage } from '.'

class Cache {
  static localStorageKey = 'bber_cache'

  static get(url) {
    const hash = Asset.createHash(url)
    const storage = Storage.get(Cache.localStorageKey)

    return storage[hash]
  }

  static set(url, data) {
    const hash = Asset.createHash(url)
    const storage = Storage.get(Cache.localStorageKey)

    storage[hash] = { data }

    Storage.set(Cache.localStorageKey, storage)
  }

  static clear() {
    Storage.clear(Cache.localStorageKey)
  }
}

export default Cache
