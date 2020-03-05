/* eslint-disable */

;(function() {
  function handlePlayButtonClick() {
    var id = this.dataset.mediaControls
    var type = this.dataset.mediaType
    var media = document.querySelector('[data-' + type + '="' + id + '"]')
    if (!media) return

    this.classList.toggle('media__controls--play')
    this.classList.toggle('media__controls--pause')

    if (media.paused) {
      media.play()
    } else {
      media.pause()
    }
  }

  function bindEventHandlers() {
    var buttonsPlay = Array.prototype.slice.call(
      document.querySelectorAll('button.media__controls'),
      0
    )
    for (var i = 0; i < buttonsPlay.length; i++) {
      buttonsPlay[i].addEventListener('click', handlePlayButtonClick, false)
    }
  }

  window.addEventListener('load', bindEventHandlers, false)
})()
