// Parsed localStorage payload: a map keyed by book hash (plus an occasional
// `viewerSettings` entry). Values are loosely typed — callers narrow.
export type StorageData = Record<string, any>

export const localStorageKey = 'bber_reader'

export function get(key: string = localStorageKey): StorageData {
  let raw = '{}'

  try {
    raw = window.localStorage.getItem(key) || raw
  } catch (_) {
    console.warn('window.localStorage is unavailable.')
  }

  return JSON.parse(raw)
}

export function set(val: unknown, key: string = localStorageKey): void {
  const value = typeof val === 'string' ? val : JSON.stringify(val)

  try {
    window.localStorage.setItem(key, value)
  } catch (_) {
    console.warn('window.localStorage is unavailable')
  }
}

export function clear(key: string = localStorageKey): void {
  const key_ = String(key)
  if (!key_) return

  try {
    window.localStorage.removeItem(key)
  } catch (_) {
    console.warn('window.localStorage is unavailable')
  }
}
