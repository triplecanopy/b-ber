export const mediaSliding = `
  .figure__fullbleed figure,
  .spread .spread__content {
    opacity: 1;
    top: 0;
    z-index: 11;
    height: 100vh;
    position: absolute;
    width: 100vw;
  }


  .figure__fullbleed figure .img-wrap img,
  .figure__fullbleed figure .img-wrap video {
    opacity: 1;
    position: absolute;
    object-fit: contain;
    width: 100% !important;
    max-width: 100%;
    max-height: 100% !important;
    height: 100%;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
`

export const mediaScrolling = `
  .figure__fullbleed figure .spread .spread__content {
    z-index: 11;
    width: 100vw;
    position: relative;
  }

  .figure__fullbleed figure .img-wrap img,
  .figure__fullbleed figure .img-wrap video {
    opacity: 1;
    object-fit: contain;
    width: 100% !important;
    max-width: 100%;
    max-height: 100% !important;
    height: 100%;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
`
