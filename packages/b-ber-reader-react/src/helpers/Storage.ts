// Parsed localStorage payload: a map keyed by book hash (plus an occasional
// `viewerSettings` entry). Values are loosely typed — callers narrow.
export type StorageData = Record<string, any>

class Storage {
  static localStorageKey = 'bber_reader'

  static get(key: string = Storage.localStorageKey): StorageData {
    let raw = '{}'

    try {
      raw = window.localStorage.getItem(key) || raw
    } catch (_) {
      console.warn('window.localStorage is unavailable.')
    }

    return JSON.parse(raw)
  }

  static set(val: unknown, key: string = Storage.localStorageKey): void {
    const value = typeof val === 'string' ? val : JSON.stringify(val)

    try {
      window.localStorage.setItem(key, value)
    } catch (_) {
      console.warn('window.localStorage is unavailable')
    }
  }

  static clear(key: string = Storage.localStorageKey): void {
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
