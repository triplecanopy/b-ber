class Storage {
  static get(key) {
    let storage

    storage = window.localStorage.getItem(key)
    if (!storage) storage = JSON.stringify({})

    storage = JSON.parse(storage)
    return storage
  }

  static set(key, value) {
    let value_ = value
    if (typeof value_ !== 'string') value_ = JSON.stringify(value_)
    window.localStorage.setItem(key, value_)
  }

  static clear(key = '') {
    const key_ = String(key)
    if (!key_) return
    window.localStorage.removeItem(key)
  }
}

export default Storage
