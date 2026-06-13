// Adapted from https://gist.github.com/paulirish/1579671 which derived from
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller.
// Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon

// MIT license

function dateNow(): number {
  if (Date.now) return Date.now()
  return new Date().getTime()
}

function rAFPolyfill(): void {
  const vendors = ['webkit', 'moz']

  // Vendor-prefixed rAF lookups are not part of the typed Window surface, so
  // the window is accessed loosely here.
  // TODO: type this
  const win = window as any

  for (let i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    const vp = vendors[i]
    win.requestAnimationFrame = win[`${vp}RequestAnimationFrame`]
    win.cancelAnimationFrame =
      win[`${vp}CancelAnimationFrame`] ||
      win[`${vp}CancelRequestAnimationFrame`]
  }

  if (
    /iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || // iOS6 is buggy
    !window.requestAnimationFrame ||
    !window.cancelAnimationFrame
  ) {
    let lastTime = 0
    win.requestAnimationFrame = (callback: FrameRequestCallback) => {
      const now = dateNow()
      // 16ms ≈ one 60fps frame; never schedule tighter than a frame.
      const nextTime = Math.max(lastTime + 16, now)
      return setTimeout(() => {
        callback((lastTime = nextTime))
      }, nextTime - now)
    }
    win.cancelAnimationFrame = clearTimeout
  }
}

export default rAFPolyfill()
