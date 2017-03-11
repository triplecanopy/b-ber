
const epub = {
  portrait(data) {
    return `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
      <div class="figure-lg">
        <figure id="${data.id}">
          <div class="img-wrap" style="width: 70%; margin: 0 auto;">
            <a href="${data.ref}.xhtml#ref${data.id}">
              <img class="portrait" alt="${data.alt}" src="../images/${data.url}" style="width: 100%; max-width: 100%; height: auto;"/>
            </a>
            <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
              <p class="small">${data.caption || ''}</p>
            </div>
          </div>
        </figure>
      </div>
    </section>`
  },
  landscape(data) {
    return `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
      <div class="figure-lg">
        <figure id="${data.id}">
          <div class="img-wrap">
            <a href="${data.ref}.xhtml#ref${data.id}">
              <img class="landscape" alt="${data.alt}" src="../images/${data.url}" style="max-width: 100%;"/>
            </a>
            <div class="figcaption" style="max-width: 100%;">
              <p class="small">${data.caption || ''}</p>
            </div>
          </div>
        </figure>
      </div>
    </section>`
  },
  portraitLong(data) {
    return `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
      <div class="figure-lg">
        <figure id="${data.id}">
          <div class="img-wrap" style="width: 60%; margin: 0 auto;">
            <a href="${data.ref}.xhtml#ref${data.id}">
              <img class="portrait-long" alt="${data.alt}" src="../images/${data.url}" style="width: 100%; max-width: 100%; height: auto;"/>
            </a>
            <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
              <p class="small">${data.caption || ''}</p>
            </div>
          </div>
        </figure>
      </div>
    </section>`
  },
  square(data) {
    return `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
      <div class="figure-lg">
        <figure id="${data.id}">
          <div class="img-wrap" style="width: 85%; margin: 0 auto;">
            <a href="${data.ref}.xhtml#ref${data.id}">
              <img class="square" alt="${data.alt}" src="../images/${data.url}" style="width: 100%; max-width: 100%; height: auto;"/>
            </a>
            <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
              <p class="small">${data.caption || ''}</p>
            </div>
          </div>
        </figure>
      </div>
    </section>`
  }
}

export default epub
