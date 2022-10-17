import Asset from './Asset'
import Storage from './Storage'

class Cache {
  static localStorageKey = 'bber_cache'

  static get(url) {
    const hash = Asset.createHash(url)
    const storage = Storage.get(Cache.localStorageKey)

    return storage && storage[hash] ? storage[hash] : null
  }

  static set(url, data) {
    const hash = Asset.createHash(url)
    const storage = Storage.get(Cache.localStorageKey)

    if (storage) {
      storage[hash] = { data }
      Storage.set(storage, Cache.localStorageKey)
    }
  }

  static clear() {
    Storage.clear(Cache.localStorageKey)
  }
}

export default Cache
