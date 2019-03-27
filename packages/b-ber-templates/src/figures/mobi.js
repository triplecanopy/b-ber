import { Html, Url } from '@canopycanopycanopy/b-ber-lib'

const mobi = {
    portrait(data) {
        return `<div class="figure__large${
            data.inline ? ` figure__inline figure__inline--portrait ${data.classes}` : ''
        }"${Html.pagebreakAttribute(data)}>
            <figure id="${data.id}">
                <div class="figure__items" style="width: 70%; margin: 0 auto;">
                    <span>
                        <img class="portrait" alt="${data.alt}" src="../images/${
            data.source
        }" style="width: 100%; max-width: 100%; height: auto;"/>
                    </span>
                    <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
                        <p class="small">${data.caption ? `${data.caption}` : ''}${
            data.caption && !data.inline ? '<br/>' : ''
        }${data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">Return</a>`}</p>
                    </div>
                </div>
            </figure>
        </div>`
    },
    landscape(data) {
        return `<div class="figure__large${
            data.inline ? ` figure__inline figure__inline--landscape ${data.classes}` : ''
        }"${Html.pagebreakAttribute(data)}>
            <figure id="${data.id}">
                <div class="figure__items">
                    <span>
                        <img class="landscape" alt="${data.alt}" src="../images/${
            data.source
        }" style="max-width: 100%;"/>
                    </span>
                    <div class="figcaption" style="max-width: 100%;">
                        <p class="small">${data.caption ? `${data.caption}` : ''}${
            data.caption && !data.inline ? '<br/>' : ''
        }${data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">Return</a>`}</p>
                    </div>
                </div>
            </figure>
        </div>`
    },
    // eslint-disable-next-line func-names
    'portrait-high': data =>
        `<div class="figure__large${
            data.inline ? ` figure__inline figure__inline--portrait-high ${data.classes}` : ''
        }"${Html.pagebreakAttribute(data)}>
            <figure id="${data.id}">
                <div class="figure__items" style="width: 60%; margin: 0 auto;">
                    <span>
                        <img class="portrait-long" alt="${data.alt}" src="../images/${
            data.source
        }" style="width: 100%; max-width: 100%; height: auto;"/>
                    </span>
                    <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
                        <p class="small">${data.caption ? `${data.caption}` : ''}${
            data.caption && !data.inline ? '<br/>' : ''
        }${data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">Return</a>`}</p>
                    </div>
                </div>
            </figure>
        </div>`,
    square(data) {
        return `<div class="figure__large${
            data.inline ? ` figure__inline figure__inline--square ${data.classes}` : ''
        }"${Html.pagebreakAttribute(data)}>
            <figure id="${data.id}">
                <div class="figure__items" style="width: 85%; margin: 0 auto;">
                    <span>
                        <img class="square" alt="${data.alt}" src="../images/${
            data.source
        }" style="width: 100%; max-width: 100%; height: auto;"/>
                    </span>
                    <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
                        <p class="small">${data.caption ? `${data.caption}` : ''}${
            data.caption && !data.inline ? '<br/>' : ''
        }${data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">Return</a>`}</p>
                    </div>
                </div>
            </figure>
        </div>`
    },
    audio(data) {
        return `
            <div class="figure__large${
                data.inline ? ` figure__inline figure__inline--landscape ${data.classes}` : ''
            }"${Html.pagebreakAttribute(data)}>
                <figure id="${data.id}">

                    <div class="figure__items">

                        <div class="audio">
                            <audio ${data.attrString}>
                                ${data.sourceElements}
                                <div class="media__fallback__${
                                    data.mediaType
                                } media__fallback--image figure__small--landscape figure__small">
                                    <figure>
                                        <img src="${data.poster}" alt="Media fallback image"/>
                                    </figure>
                                </div>
                                <p class="media__fallback__${
                                    data.mediaType
                                } media__fallback--text">Your device does not support the HTML5 ${
            data.mediaType
        } API.</p>
                            </audio>
                        </div>

                        <div class="figcaption" style="max-width: 100%;">
                            <p class="small">
                                ${data.caption ? `${data.caption}<br/>` : ''}
                                <a href="${data.ref}.xhtml#ref${data.id}">Return</a>
                            </p>
                        </div>

                    </div>

                </figure>
            </div>`
    },
    video(data) {
        return `
            <div class="figure__large${
                data.inline ? ` figure__inline figure__inline--landscape ${data.classes}` : ''
            }"${Html.pagebreakAttribute(data)}>
                <figure id="${data.id}">

                    <div class="figure__items">

                        <div class="video">
                            <video ${data.attrString}>
                                ${data.sourceElements}
                                <div class="media__fallback__${
                                    data.mediaType
                                } media__fallback--image figure__small--landscape figure__small">
                                    <figure>
                                        <img src="${data.poster}" alt="Media fallback image"/>
                                    </figure>
                                </div>
                                <p class="media__fallback__${
                                    data.mediaType
                                } media__fallback--text">Your device does not support the HTML5 ${
            data.mediaType
        } API.</p>
                            </video>
                        </div>

                        <div class="figcaption" style="max-width: 100%;">
                            <p class="small">
                                ${data.caption ? `${data.caption}<br/>` : ''}
                                <a href="${data.ref}.xhtml#ref${data.id}">Return</a>
                            </p>
                        </div>

                    </div>

                </figure>
            </div>`
    },
    iframe(data) {
        return `
            <div class="figure__large${
                data.inline ? ` figure__inline figure__inline--landscape ${data.classes}` : ''
            }"${Html.pagebreakAttribute(data)}>
                <figure id="${data.id}">
                    <div class="figure__items">
                        <div class="iframe">
                            <iframe src="${Url.encodeQueryString(data.source)}" />
                        </div>

                        <div class="figcaption" style="max-width: 100%;">
                            <p class="small">
                                ${data.caption ? `${data.caption}<br/>` : ''}
                                <a href="${data.ref}.xhtml#ref${data.id}">Return</a>
                            </p>
                        </div>

                    </div>

                </figure>
            </div>`
    },
}

export default mobi
