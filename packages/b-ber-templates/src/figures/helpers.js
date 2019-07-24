import { Url } from '@canopycanopycanopy/b-ber-lib'
import uniq from 'lodash.uniq'

const FULLBLEED_CLASS_NAME = 'figure__fullbleed'

const getClassNamesArray = ({ classes = '' }) => classes.split(' ')

const getFigureInlineClasses = (data, ratioName) =>
    data.inline || data.applyInlineClasses
        ? uniq(['figure__large', 'figure__inline', `figure__inline--${ratioName}`].concat(getClassNamesArray(data)))
              .filter(Boolean)
              .join(' ')
        : `figure__large figure__large--${ratioName}`

const getMediaInlineClasses = data =>
    data.inline || data.applyInlineClasses
        ? 'figure__large figure__large--media figure__inline--square'
        : 'figure__large figure__large--media figure__large--square'

const getSectionOpen = ({ inline }) =>
    inline ? '' : '<section epub:type="loi" title="Figures" class="chapter figures">'

const getImageClassName = (data, ratioName) =>
    getClassNamesArray(data).includes(FULLBLEED_CLASS_NAME) ? 'fullbleed' : ratioName

// for devices that support wrapping images with anchor tags (not mobi)
const linkedImage = data =>
    `
    %LINK_OPEN%
        <img class="%IMAGE_CLASS_NAME%" alt="%IMAGE_ALT%" src="../images/%IMAGE_SRC%"/>
    %LINK_CLOSE%
    <div class="figcaption">
        <p class="small">%CAPTION_CONTENT%</p>
    </div>
    `
        .replace(/%LINK_OPEN%/, data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">`)
        .replace(/%LINK_CLOSE%/, data.inline ? '' : '</a>')
        .replace(/%IMAGE_CLASS_NAME%/, data.imageClassName)
        .replace(/%IMAGE_ALT%/, data.alt)
        .replace(/%IMAGE_SRC%/, data.source)
        .replace(/%CAPTION_CONTENT%/, data.caption)

// inverse of above. the image is wrapped in a span and a back link is added
const unLinkedImage = data =>
    `
    <span>
        <img class="portrait" alt="%IMAGE_ALT%" src="../images/%IMAGE_SRC%"/>
    </span>
        <div class="figcaption">
            <p class="small">
                %CAPTION_CONTENT%
                %CAPTION_CONTENT_AFTER%
                %CAPTION_BACK_LINK%
            </p>
        </div>
    </div>
    `
        .replace(/%IMAGE_ALT%/, data.alt)
        .replace(/%IMAGE_SRC%/, data.source)
        .replace(/%CAPTION_CONTENT%/, data.caption)
        .replace(/%CAPTION_CONTENT_AFTER%/, data.caption && !data.inline ? '<br/>' : '')
        .replace(/%CAPTION_BACK_LINK%/, data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">Return</a>`)

export const figureTemplate = data =>
    `
    %SECTION_OPEN%
        <div class="%FIGURE_CLASS_NAMES%">
            <figure id="%ID%">
                <div class="figure__items">
                    %IMAGE%
                </div>
            </figure>
        </div>
    %SECTION_CLOSE%
`
        .replace(/%SECTION_OPEN%/, getSectionOpen(data))
        .replace(/%FIGURE_CLASS_NAMES%/, data.classes)
        .replace(/%ID%/g, data.id)
        .replace(/%IMAGE%/g, data.linkImages ? linkedImage(data) : unLinkedImage(data))
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
                    <div class="figcaption">
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
        .replace(/%SECTION_OPEN%/, getSectionOpen(data))
        // TODO: `figure__inline--square` class should be replaced with media aspect ratio
        .replace(/%FIGURE_CLASS_NAMES%/, getMediaInlineClasses(data))
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
        <div class="figure__large figure__large--iframe">
            <figure id="%ID%">
                <div class="figure__items">
                    <div class="iframe">
                        <iframe src="%SRC%" />
                    </div>

                    <div class="figcaption">
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
        .replace(/%SECTION_OPEN%/, getSectionOpen(data))
        .replace(/%ID%/g, data.id)
        .replace(/%SRC%/g, Url.encodeQueryString(data.source))
        .replace(/%CAPTION%/g, data.caption ? `${data.caption}<br/>` : '')
        .replace(/%REF%/g, data.ref)
        .replace(/%SECTION_CLOSE%/g, data.inline ? '' : '</section>')

export const figure = ({ data, ratioName, applyInlineClasses = false, linkImages = true }) =>
    figureTemplate({
        ...data,
        linkImages,
        classes: getFigureInlineClasses(data, ratioName),
        imageClassName: getImageClassName(data, ratioName),
        applyInlineClasses,
    })
