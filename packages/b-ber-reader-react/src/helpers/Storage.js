class Storage {
  static localStorageKey = 'bber_reader'

  static get(key = Storage.localStorageKey) {
    let storage = '{}'

    try {
      storage = window.localStorage.getItem(key) || storage
    } catch (_) {
      console.warn('window.localStorage is unavailable.')
    }

    storage = JSON.parse(storage)
    return storage
  }

  static set(val, key = Storage.localStorageKey) {
    let value = val
    if (typeof value !== 'string') value = JSON.stringify(value)

    try {
      window.localStorage.setItem(key, value)
    } catch (_) {
      console.warn('window.localStorage is unavailable')
    }
  }

  static clear(key = Storage.localStorageKey) {
    const key_ = String(key)
    if (!key_) return

    try {
      window.localStorage.removeItem(key)
    } catch (_) {
      console.warn('window.localStorage is unavailable')
    }
  }
}

export default Storage
