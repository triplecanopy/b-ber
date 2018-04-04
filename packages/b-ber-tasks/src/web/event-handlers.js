/* eslint-disable */

function handlePlayButtonClick() {
    var id = this.dataset.mediaControls
    var video = document.querySelector('[data-video="'+ id +'"]')
    if (!video) return

    this.classList.toggle('media__controls--play media__controls--pause')
    if (video.paused) {
        video.play()
    }
    else {
        video.pause()
    }
}

function bindEventHandlers() {
    var buttonsPlay = Array.prototype.slice.call(document.querySelectorAll('button.media__controls'), 0)
    for (var i = 0; i < buttonsPlay.length; i++) {
        buttonsPlay[i].addEventListener('click', handlePlayButtonClick, false)
    }

}

window.addEventListener('load', bindEventHandlers, false)
