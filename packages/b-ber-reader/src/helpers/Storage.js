class Storage {
  static get(key) {
    let storage = '{}'

    try {
      storage = window.localStorage.getItem(key) || storage
    } catch (_) {
      console.warn('window.localStorage is unavailable')
    }

    storage = JSON.parse(storage)
    return storage
  }

  static set(key, val) {
    let value = val
    if (typeof value !== 'string') value = JSON.stringify(value)

    try {
      window.localStorage.setItem(key, value)
    } catch (_) {
      console.warn('window.localStorage is unavailable')
    }
  }

  static clear(key = '') {
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
