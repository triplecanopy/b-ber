/* eslint-disable max-len */
const epub = {
  portrait(data) {
    return `${!data.inline ? '<section epub:type="loi" title="Figures" class="chapter figures">' : ''}
      <div class="figure-lg"${data.pagebreak ? ` style="page-break-${data.pagebreak}:always;"` : ''}>
        <figure id="${data.id}">
          <div class="img-wrap" style="width: 70%; margin: 0 auto;">
            ${!data.inline ? `<a href="${data.ref}.xhtml#ref${data.id}">` : ''}
              <img class="portrait" alt="${data.alt}" src="../images/${data.source}" style="width: 100%; max-width: 100%; height: auto;"/>
            ${!data.inline ? '</a>' : ''}
            <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
              <p class="small">${data.caption}</p>
            </div>
          </div>
        </figure>
      </div>
    ${!data.inline ? '</section>' : ''}`
  },
  landscape(data) {
    return `${!data.inline ? '<section epub:type="loi" title="Figures" class="chapter figures">' : ''}
      <div class="figure-lg"${data.pagebreak ? ` style="page-break-${data.pagebreak}:always;"` : ''}>
        <figure id="${data.id}">
          <div class="img-wrap">
            ${!data.inline ? `<a href="${data.ref}.xhtml#ref${data.id}">` : ''}
              <img class="landscape" alt="${data.alt}" src="../images/${data.source}" style="max-width: 100%;"/>
            ${!data.inline ? '</a>' : ''}
            <div class="figcaption" style="max-width: 100%;">
              <p class="small">${data.caption}</p>
            </div>
          </div>
        </figure>
      </div>
    ${!data.inline ? '</section>' : ''}`
  },
  portraitLong(data) {
    return `${!data.inline ? '<section epub:type="loi" title="Figures" class="chapter figures">' : ''}
      <div class="figure-lg"${data.pagebreak ? ` style="page-break-${data.pagebreak}:always;"` : ''}>
        <figure id="${data.id}">
          <div class="img-wrap" style="width: 60%; margin: 0 auto;">
            ${!data.inline ? `<a href="${data.ref}.xhtml#ref${data.id}">` : ''}
              <img class="portrait-long" alt="${data.alt}" src="../images/${data.source}" style="width: 100%; max-width: 100%; height: auto;"/>
            ${!data.inline ? '</a>' : ''}
            <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
              <p class="small">${data.caption}</p>
            </div>
          </div>
        </figure>
      </div>
    ${!data.inline ? '</section>' : ''}`
  },
  square(data) {
    return `${!data.inline ? '<section epub:type="loi" title="Figures" class="chapter figures">' : ''}
      <div class="figure-lg"${data.pagebreak ? ` style="page-break-${data.pagebreak}:always;"` : ''}>
        <figure id="${data.id}">
          <div class="img-wrap" style="width: 85%; margin: 0 auto;">
            ${!data.inline ? `<a href="${data.ref}.xhtml#ref${data.id}">` : ''}
              <img class="square" alt="${data.alt}" src="../images/${data.source}" style="width: 100%; max-width: 100%; height: auto;"/>
            ${!data.inline ? '</a>' : ''}
            <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
              <p class="small">${data.caption}</p>
            </div>
          </div>
        </figure>
      </div>
    ${!data.inline ? '</section>' : ''}`
  },
}

export default epub
