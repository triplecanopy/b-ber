import { Url } from '@canopycanopycanopy/b-ber-lib'
import isPlainObject from 'lodash.isplainobject'
import uniq from 'lodash.uniq'

const FULLBLEED_CLASS_NAME = 'figure__fullbleed'
const classNamesArray = data => (data.classes || '').split(' ')

const inlineClasses = (data, ratioName) =>
    uniq(['figure__large', 'figure__inline', `figure__inline--${ratioName}`].concat(classNamesArray(data)))
        .filter(Boolean)
        .join(' ')

const createStyleAttribute = data => {
    if (!isPlainObject(data) || !Object.keys(data).length) return ''
    const attrs = Object.entries(data).reduce((acc, [key, val]) => acc.concat(`${key}:${val};`), '')
    return `style="${attrs}"`
}

export const figureTemplate = data =>
    `
    %SECTION_OPEN%
        <div class="%FIGURE_CLASS_NAMES%">
            <figure id="%ID%">
                <div class="figure__items" %FIGURE_STYLES%>
                    %LINK_OPEN%
                        <img class="%IMAGE_CLASS_NAME%" alt="%IMAGE_ALT%" src="../images/%IMAGE_SRC%" %IMAGE_STYLES%/>
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
            data.inline ? '' : '<section epub:type="loi" title="Figures" class="chapter figures">',
        )
        .replace(/%FIGURE_CLASS_NAMES%/, data.inline || data.applyInlineClasses ? data.classes : 'figure__large')
        .replace(/%ID%/g, data.id)
        .replace(/%FIGURE_STYLES%/, createStyleAttribute(data.figureStyles))
        .replace(/%IMAGE_STYLES%/, createStyleAttribute(data.imageStyles))
        .replace(/%FIGCAPTION_STYLES%/, createStyleAttribute(data.figcaptionStyles))
        .replace(/%LINK_OPEN%/, data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">`)
        .replace(/%LINK_CLOSE%/, data.inline ? '' : '</a>')
        .replace(/%IMAGE_CLASS_NAME%/, data.imageClassName)
        .replace(/%IMAGE_ALT%/, data.alt)
        .replace(/%IMAGE_SRC%/, data.source)
        .replace(/%CAPTION_CONTENT%/, data.caption)
        .replace(/%SECTION_CLOSE%/, data.inline ? '' : '</section>')

export const media = data =>
    `
    %SECTION_OPEN%
        <div class="%FIGURE_CLASS_NAMES%">
            <figure id="%ID%">
                <div class="figure__items">
                    <div class="%MEDIA_TYPE%">
                        <%MEDIA_TYPE% %ELEMENT_ATTRIBUTES%>
                            %SOURCE_ELEMENTS%
                            <div class="media__fallback__%MEDIA_TYPE% media__fallback--image figure__small--landscape figure__small">
                                <figure>
                                    <img src="%POSTER_IMAGE%" alt="Media fallback image"/>
                                </figure>
                            </div>
                            <p class="media__fallback__%MEDIA_TYPE% media__fallback--text">Your device does not support the HTML5 %MEDIA_TYPE% API.</p>
                        </%MEDIA_TYPE%>
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
            data.inline ? '' : '<section epub:type="loi" title="Figures" class="chapter figures">',
        )
        // TODO: `figure__inline--square` class should be replaced with media aspect ratio
        .replace(
            /%FIGURE_CLASS_NAMES%/,
            data.inline || data.applyInlineClasses ? 'figure__large figure__inline--square' : 'figure__large',
        )
        .replace(/%ID%/g, data.id)
        .replace(/%MEDIA_TYPE%/g, data.mediaType)
        .replace(/%ELEMENT_ATTRIBUTES%/g, data.attrString)
        .replace(/%SOURCE_ELEMENTS%/g, data.sourceElements)
        .replace(/%POSTER_IMAGE%/g, data.poster)
        .replace(/%CAPTION%/g, data.caption ? `${data.caption}<br/>` : '')
        .replace(/%REF%/g, data.ref)
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
            data.inline ? '' : '<section epub:type="loi" title="Figures" class="chapter figures">',
        )
        .replace(/%ID%/g, data.id)
        .replace(/%SRC%/g, Url.encodeQueryString(data.source))
        .replace(/%CAPTION%/g, data.caption ? `${data.caption}<br/>` : '')
        .replace(/%REF%/g, data.ref)
        .replace(/%SECTION_CLOSE%/g, data.inline ? '' : '</section>')

export const figure = ({
    data,
    ratioName,
    figureStyles = {},
    imageStyles = {},
    figcaptionStyles = {},
    applyInlineClasses = false,
}) => {
    const classes = inlineClasses(data, ratioName)
    const imageClassName = classNamesArray(data).indexOf(FULLBLEED_CLASS_NAME) > -1 ? 'fullbleed' : ratioName

    return figureTemplate({
        ...data,
        classes,
        figureStyles,
        imageStyles,
        figcaptionStyles,
        imageClassName,
        applyInlineClasses,
    })
}
