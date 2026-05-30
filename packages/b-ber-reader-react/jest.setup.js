// Polyfills for the jsdom test environment

// ResizeObserver is not implemented in jsdom. Spread.jsx and withLastSpreadIndex.jsx
// use it; without this stub those components crash on import during tests.
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this._callback = callback
  }

  // eslint-disable-next-line class-methods-use-this
  observe() {}

  // eslint-disable-next-line class-methods-use-this
  unobserve() {}

  // eslint-disable-next-line class-methods-use-this
  disconnect() {}

  // Test helper: manually trigger the callback as if a resize occurred.
  // Usage: observer.trigger([{ target: domNode }])
  trigger(entries) {
    this._callback(entries, this)
  }
}

// matchMedia is not implemented in jsdom. Viewport helpers call window.matchMedia;
// return a non-matching stub so isVerticallyScrolling / isMobile always return false.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})
