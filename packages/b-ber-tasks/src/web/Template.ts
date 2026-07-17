// Inline SVG markup for the static-website chrome. This is plain emitted
// HTML (not React), so the `Icons/` component convention in b-ber-reader-react
// does not apply here — the `<svg>` strings are vendored directly. Path data
// is the official Material Symbols (filled) glyph set, Apache-2.0.
const Svg = {
  viewList: `<svg viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>`,
  search: `<svg viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>`,
  close: `<svg viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg"><path d="M480-424 284-228q-15 15-35.5 15T213-228q-15-15-15-35.5t15-35.5l196-196-196-196q-15-15-15-35.5t15-35.5q15-15 35.5-15t35.5 15l196 196 196-196q15-15 35.5-15t35.5 15q15 15 15 35.5T732-690L536-494l196 196q15 15 15 35.5T732-227q-15 15-35.5 15T661-227L480-424Z"/></svg>`,
  info: `<svg viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-53-53-84.5-124.5T80-480q0-83 31.5-156T197-763q53-53 124.5-84.5T480-880q83 0 156 31.5T763-763q53 53 84.5 124.5T880-480q0 83-31.5 156T763-197q-53 53-124.5 84.5T480-80Z"/></svg>`,
  arrowBack: `<svg viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg"><path d="M313-440 537-216l-57 56-296-296 296-296 57 56-224 224h447v80H313Z"/></svg>`,
  arrowForward: `<svg viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg"><path d="M647-440H200v-80h447L423-744l57-56 296 296-296 296-57-56 224-224Z"/></svg>`,
}

class Template {
  static header(title: string) {
    return `
      <header class="publication__header" role="navigation">
        <div class="header__item header__item__toggle header__item__toggle--toc">
          <button>${Svg.viewList}</button>
        </div>

        <div class="header__item header__item__title">
          <h1>${title}</h1>
        </div>

        <div class="header__item publication__search">
          <button class="publication__search__button publication__search__button--open">${Svg.search}</button>
          <input type="text" disabled="disabled" class="publication__search__input" placeholder="" name="s" value="" />
          <button class="publication__search__button publication__search__button--close">${Svg.close}</button>
        </div>

        <div class="header__item header__item__toggle header__item__toggle--info">
          <button>${Svg.info}</button>
        </div>
      </header>
    `
  }

  static metadata(data: any) {
    return `
      <dl>
        ${data.reduce(
          (acc: string, curr: any) =>
            acc.concat(`
              <dt>${curr.term}</dt>
              <dd>${curr.value}</dd>
            `),
          ''
        )}
      </dl>
    `
  }

  static toc(baseURL: string, title: string, content: string) {
    return `
      <nav class="publication__toc" role="navigation">
        <div class="publication__title">
          <a href="${baseURL}">${title}</a>
        </div>
        ${content}
      </nav>
    `
  }

  static info(content: string) {
    return `
      <nav class="publication__info" role="navigation">
        ${content}
      </nav>
    `
  }

  static prev(baseURL: string, href: string) {
    return `
      <div class="publication__nav__prev">
        <a class="publication__nav__link" href="${baseURL}text/${href}">
          ${Svg.arrowBack}
        </a>
      </div>
    `
  }

  static next(baseURL: string, href: string) {
    return `
      <div class="publication__nav__next">
        <a class="publication__nav__link" href="${baseURL}text/${href}">
          ${Svg.arrowForward}
        </a>
      </div>
    `
  }

  static pagination(prev: string, next: string) {
    return `
      <nav class="publication__nav" role="navigation">
        ${prev}
        ${next}
      </nav>
    `
  }

  static styles() {
    return `
      <style>
        body { opacity: 0; transition: opacity 250ms ease; }
        body.ready { opacity: 1 !important; }
      </style>
    `
  }

  static scripts(content: any) {
    return `
      <script type="text/javascript">
      // <![CDATA[
      ${content}
      // ]]>
      </script>
    `
  }

  static cover(firstPage: string, coverImageSrc: string) {
    return `
      <a class="cover__image__link" href="${firstPage}">
        <img class="cover__image" src="${coverImageSrc}" alt="Cover" />
      </a>
    `
  }

  static robots(isPrivate: any) {
    return isPrivate
      ? '<meta name="robots" content="noindex,nofollow"/>'
      : '<meta name="robots" content="index,follow"/>'
  }

  static body(styleBlock: string, headerElement: string) {
    return `
      <body style="opacity: 0;">
      ${styleBlock}
      <div class="publication">
      ${headerElement}
      <div class="publication__contents">
    `
  }

  static footer(
    pageNavigation: string,
    tocElement: string,
    infoElement: string,
    navigationToggleScript: string,
    webWorkerScript: string,
    evenHandlerScript: string
  ) {
    return `
      </div> <!-- / .publication__contents -->
      ${pageNavigation}
      </div> <!-- / .publication -->
      ${tocElement}
      ${infoElement}
      ${navigationToggleScript}
      ${webWorkerScript}
      ${evenHandlerScript}
      $1
    `
  }

  static index(
    baseURL: string,
    robotsMeta: string,
    title: string,
    styleBlock: string,
    tocElement: string,
    infoElement: string,
    headerElement: string,
    coverImage: string,
    navigationToggleScript: string,
    webWorkerScript: string
  ) {
    return `
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <html xmlns="http://www.w3.org/1999/xhtml"
        xmlns:epub="http://www.idpf.org/2007/ops"
        xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
        epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
        <meta http-equiv="default-style" content="text/html charset=utf-8"/>
        ${robotsMeta}
        <link rel="manifest" type="application/webpub+json" href="${baseURL}manifest.json">
        <link rel="stylesheet" type="text/css" href="${baseURL}stylesheets/application.css"/>

        <head>
          <title>${title}</title>
          ${styleBlock}
        </head>
        <body style="opacity: 0;">
          ${tocElement}
          ${infoElement}
          <div class="publication">
            ${headerElement}
            <div class="publication__contents">
              <section>
                ${coverImage}
              </section>
            </div>
          </div>
          ${navigationToggleScript}
          ${webWorkerScript}
        </body>
      </html>
    `
  }
}

export default Template
