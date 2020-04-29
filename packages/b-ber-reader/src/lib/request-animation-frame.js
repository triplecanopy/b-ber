// Adapted from https://gist.github.com/paulirish/1579671 which derived from
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller.
// Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon

// MIT license

function dateNow() {
  if (Date.now) return Date.now()
  return new Date().getTime()
}

function rAFPolyfill() {
  const vendors = ['webkit', 'moz']

  for (let i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    const vp = vendors[i]
    window.requestAnimationFrame = window[`${vp}RequestAnimationFrame`]
    window.cancelAnimationFrame =
      window[`${vp}CancelAnimationFrame`] ||
      window[`${vp}CancelRequestAnimationFrame`]
  }

  if (
    /iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || // iOS6 is buggy
    !window.requestAnimationFrame ||
    !window.cancelAnimationFrame
  ) {
    let lastTime = 0
    window.requestAnimationFrame = callback => {
      const now = dateNow()
      const nextTime = Math.max(lastTime + 16, now)
      return setTimeout(() => {
        callback((lastTime = nextTime))
      }, nextTime - now)
    }
    window.cancelAnimationFrame = clearTimeout
  }
}

export default rAFPolyfill()
