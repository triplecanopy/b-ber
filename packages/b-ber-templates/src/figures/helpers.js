import { Html, Url } from '@canopycanopycanopy/b-ber-lib'

export const figure = data =>
    `
    %SECTION_OPEN%
        <div class="%FIGURE_CLASS_NAMES%" %PAGE_BREAK_STYLES%>
            <figure id="%ID%">
                <div class="figure__items" %FIGURE_STYLES%>
                    %LINK_OPEN%
                        <img class="portrait" alt="%IMAGE_ALT%" src="../images/%IMAGE_SRC%" %IMAGE_STYLES%/>
                    %LINK_CLOSE%
                    <div class="figcaption" %FIGCAPTION_STYLES%>
                        <p class="small">%CAPTION_CONTENT%</p>
                    </div>
                </div>
            </figure>
        </div>
    %SECTION_CLOSE%
`
        .replace(
            /%SECTION_OPEN%/,
            data.inline
                ? ''
                : '<section epub:type="loi" title="Figures" class="chapter figures">',
        )
        .replace(/%FIGURE_CLASS_NAMES%/, data.classes)
        .replace(/%PAGE_BREAK_STYLES%/, Html.pagebreakAttribute(data))
        .replace(/%ID%/, data.id)
        .replace(
            /%FIGURE_STYLES%/,
            data.figureStyles ? `style="${data.figureStyles}"` : '',
        )
        .replace(
            /%IMAGE_STYLES%/,
            data.imageStyles ? `style="${data.imageStyles}"` : '',
        )
        .replace(
            /%FIGCAPTION_STYLES%/,
            data.figcaptionStyles ? `style="${data.figcaptionStyles}"` : '',
        )
        .replace(
            /%LINK_OPEN%/,
            data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">`,
        )
        .replace(/%LINK_CLOSE%/, data.inline ? '' : '</a>')
        .replace(/%IMAGE_ALT%/, data.alt)
        .replace(/%IMAGE_SRC%/, data.source)
        .replace(/%CAPTION_CONTENT%/, data.caption)
        .replace(/%SECTION_CLOSE%/, data.inline ? '' : '</section>')

export const media = data =>
    `
    %SECTION_OPEN%
        <div class="figure__large">
            <figure id="%ID%">
                <div class="figure__items">
                    <div class="video">
                        <%MEDIA_TYPE% %ELEMENT_ATTRIBUTES%>
                            %SOURCE_ELEMENTS%
                            <div class="media__fallback__%MEDIA_TYPE% media__fallback--image figure__small--landscape figure__small">
                                <figure>
                                    <img src="%POSTER_IMAGE%" alt="Media fallback image"/>
                                </figure>
                            </div>
                            <p class="media__fallback__%MEDIA_TYPE% media__fallback--text">Your device does not support the HTML5 %MEDIA_TYPE% API.</p>
                        </video>
                    </div>
                    <div class="figcaption" style="max-width: 100%;">
                        <p class="small">
                            %CAPTION%
                            <a href="%REF%.xhtml#ref%ID%">Return</a>
                        </p>
                    </div>
                </div>
            </figure>
        </div>
    %SECTION_CLOSE%
    `
        .replace(
            /%SECTION_OPEN%/,
            data.inline
                ? ''
                : '<section epub:type="loi" title="Figures" class="chapter figures">',
        )
        .replace(/%ID%/, data.id)
        .replace(/%MEDIA_TYPE%/, data.mediaType)
        .replace(/%ELEMENT_ATTRIBUTES%/, data.attrString)
        .replace(/%SOURCE_ELEMENTS%/, data.sourceElements)
        .replace(/%POSTER_IMAGE%/, data.poster)
        .replace(/%CAPTION%/, data.caption ? `${data.caption}<br>` : '')
        .replace(/%REF%/, data.ref)
        .replace(/%SECTION_CLOSE%/, data.inline ? '' : '</section>')

export const iframe = data =>
    `
    %SECTION_OPEN%
        <div class="figure__large">
            <figure id="%ID%">
                <div class="figure__items">
                    <div class="iframe">
                        <iframe src="%SRC%" />
                    </div>

                    <div class="figcaption" style="max-width: 100%;">
                        <p class="small">
                            %CAPTION%
                            <a href="%REF%.xhtml#ref%ID%">Return</a>
                        </p>
                    </div>
                </div>
            </figure>
        </div>
    %SECTION_CLOSE%
    `
        .replace(
            /%SECTION_OPEN%/,
            data.inline
                ? ''
                : '<section epub:type="loi" title="Figures" class="chapter figures">',
        )
        .replace(/%ID%/, data.id)
        .replace(/%SRC%/, Url.encodeQueryString(data.source))
        .replace(/%CAPTION%/, data.caption ? `${data.caption}<br/>` : '')
        .replace(/%REF%/, data.ref)
        .replace(/%SECTION_CLOSE%/, data.inline ? '' : '</section>')
