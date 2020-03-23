class Template {
  static header(title) {
    return `
      <header class="publication__header" role="navigation">
        <div class="header__item header__item__toggle header__item__toggle--toc">
          <button class="material-icons">view_list</button>
        </div>

        <div class="header__item header__item__title">
          <h1>${title}</h1>
        </div>

        <div class="header__item publication__search">
          <button class="material-icons publication__search__button publication__search__button--open">search</button>
          <input type="text" disabled="disabled" class="publication__search__input" placeholder="" name="s" value="" />
          <button class="material-icons publication__search__button publication__search__button--close">close</button>
        </div>

        <div class="header__item header__item__toggle header__item__toggle--info">
          <button class="material-icons">info</button>
        </div>
      </header>
    `
  }

  static metadata(data) {
    return `
      <dl>
        ${data.reduce(
          (acc, curr) =>
            acc.concat(`
              <dt>${curr.term}</dt>
              <dd>${curr.value}</dd>
            `),
          ''
        )}
      </dl>
    `
  }

  static toc(baseURL, title, content) {
    return `
      <nav class="publication__toc" role="navigation">
        <div class="publication__title">
          <a href="${baseURL}">${title}</a>
        </div>
        ${content}
      </nav>
    `
  }

  static info(content) {
    return `
      <nav class="publication__info" role="navigation">
        ${content}
      </nav>
    `
  }

  static prev(baseURL, href) {
    return `
      <div class="publication__nav__prev">
        <a class="publication__nav__link" href="${baseURL}text/${href}">
          <i class="material-icons">arrow_back</i>
        </a>
      </div>
    `
  }

  static next(baseURL, href) {
    return `
      <div class="publication__nav__next">
        <a class="publication__nav__link" href="${baseURL}text/${href}">
          <i class="material-icons">arrow_forward</i>
        </a>
      </div>
    `
  }

  static pagination(prev, next) {
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

  static scripts(content) {
    return `
      <script type="text/javascript">
      // <![CDATA[
      ${content}
      // ]]>
      </script>
    `
  }

  static cover(firstPage, coverImageSrc) {
    return `
      <a class="cover__image__link" href="${firstPage}">
        <img class="cover__image" src="${coverImageSrc}" alt="Cover" />
      </a>
    `
  }

  static robots(isPrivate) {
    return isPrivate
      ? '<meta name="robots" content="noindex,nofollow"/>'
      : '<meta name="robots" content="index,follow"/>'
  }

  static body(styleBlock, headerElement) {
    return `
      <body style="opacity: 0;">
      ${styleBlock}
      <div class="publication">
      ${headerElement}
      <div class="publication__contents">
    `
  }

  static footer(
    pageNavigation,
    tocElement,
    infoElement,
    navigationToggleScript,
    webWorkerScript,
    evenHandlerScript
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
    baseURL,
    robotsMeta,
    title,
    styleBlock,
    tocElement,
    infoElement,
    headerElement,
    coverImage,
    navigationToggleScript,
    webWorkerScript
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
