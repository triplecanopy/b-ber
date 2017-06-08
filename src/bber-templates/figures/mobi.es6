
/* eslint-disable max-len */

const mobi = {
  portrait(data) {
    return `<div class="figure-lg">
      <figure id="${data.id}">
        <div class="img-wrap" style="width: 70%; margin: 0 auto;">
          <span>
            <img class="portrait" alt="${data.alt}" src="../images/${data.source}" style="width: 100%; max-width: 100%; height: auto;"/>
          </span>
          <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
            <p class="small">${data.caption ? `${data.caption}<br/>` : ''}<a href="${data.ref}.xhtml#ref${data.id}">Return</a></p>
          </div>
        </div>
      </figure>
    </div>`
  },
  landscape(data) {
    return `<div class="figure-lg">
      <figure id="${data.id}">
        <div class="img-wrap">
          <span>
            <img class="landscape" alt="${data.alt}" src="../images/${data.source}" style="max-width: 100%;"/>
          </span>
          <div class="figcaption" style="max-width: 100%;">
            <p class="small">${data.caption ? `${data.caption}<br/>` : ''}<a href="${data.ref}.xhtml#ref${data.id}">Return</a></p>
          </div>
        </div>
      </figure>
    </div>`
  },
  portraitLong(data) {
    return `<div class="figure-lg">
      <figure id="${data.id}">
        <div class="img-wrap" style="width: 60%; margin: 0 auto;">
          <span>
            <img class="portrait-long" alt="${data.alt}" src="../images/${data.source}" style="width: 100%; max-width: 100%; height: auto;"/>
          </span>
          <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
            <p class="small">${data.caption ? `${data.caption}<br/>` : ''}<a href="${data.ref}.xhtml#ref${data.id}">Return</a></p>
          </div>
        </div>
      </figure>
    </div>`
  },
  square(data) {
    return `<div class="figure-lg">
      <figure id="${data.id}">
        <div class="img-wrap" style="width: 85%; margin: 0 auto;">
          <span>
            <img class="square" alt="${data.alt}" src="../images/${data.source}" style="width: 100%; max-width: 100%; height: auto;"/>
          </span>
          <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
            <p class="small">${data.caption ? `${data.caption}<br/>` : ''}<a href="${data.ref}.xhtml#ref${data.id}">Return</a></p>
          </div>
        </div>
      </figure>
    </div>`
  },
}

export default mobi
