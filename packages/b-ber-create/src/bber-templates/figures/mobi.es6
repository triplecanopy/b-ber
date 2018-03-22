/* eslint-disable max-len */

import { getPagebreakAttribute, encodeQueryString } from 'bber-utils'

const mobi = {
    portrait(data) {
        return `<div class="figure__large${data.inline ? ` figure__inline figure__inline--portrait ${data.classes}` : ''}"${getPagebreakAttribute(data)}>
            <figure id="${data.id}">
                <div class="img-wrap" style="width: 70%; margin: 0 auto;">
                    <span>
                        <img class="portrait" alt="${data.alt}" src="../images/${data.source}" style="width: 100%; max-width: 100%; height: auto;"/>
                    </span>
                    <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
                        <p class="small">${data.caption ? `${data.caption}` : ''}${data.caption && !data.inline ? '<br/>' : ''}${data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">Return</a>`}</p>
                    </div>
                </div>
            </figure>
        </div>`
    },
    landscape(data) {
        return `<div class="figure__large${data.inline ? ` figure__inline figure__inline--landscape ${data.classes}` : ''}"${getPagebreakAttribute(data)}>
            <figure id="${data.id}">
                <div class="img-wrap">
                    <span>
                        <img class="landscape" alt="${data.alt}" src="../images/${data.source}" style="max-width: 100%;"/>
                    </span>
                    <div class="figcaption" style="max-width: 100%;">
                        <p class="small">${data.caption ? `${data.caption}` : ''}${data.caption && !data.inline ? '<br/>' : ''}${data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">Return</a>`}</p>
                    </div>
                </div>
            </figure>
        </div>`
    },
    'portrait-high': function (data) { // eslint-disable-line func-names
        return `<div class="figure__large${data.inline ? ` figure__inline figure__inline--portrait-high ${data.classes}` : ''}"${getPagebreakAttribute(data)}>
            <figure id="${data.id}">
                <div class="img-wrap" style="width: 60%; margin: 0 auto;">
                    <span>
                        <img class="portrait-long" alt="${data.alt}" src="../images/${data.source}" style="width: 100%; max-width: 100%; height: auto;"/>
                    </span>
                    <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
                        <p class="small">${data.caption ? `${data.caption}` : ''}${data.caption && !data.inline ? '<br/>' : ''}${data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">Return</a>`}</p>
                    </div>
                </div>
            </figure>
        </div>`
    },
    square(data) {
        return `<div class="figure__large${data.inline ? ` figure__inline figure__inline--square ${data.classes}` : ''}"${getPagebreakAttribute(data)}>
            <figure id="${data.id}">
                <div class="img-wrap" style="width: 85%; margin: 0 auto;">
                    <span>
                        <img class="square" alt="${data.alt}" src="../images/${data.source}" style="width: 100%; max-width: 100%; height: auto;"/>
                    </span>
                    <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
                        <p class="small">${data.caption ? `${data.caption}` : ''}${data.caption && !data.inline ? '<br/>' : ''}${data.inline ? '' : `<a href="${data.ref}.xhtml#ref${data.id}">Return</a>`}</p>
                    </div>
                </div>
            </figure>
        </div>`
    },
    audio(data) {
        return `
            <div class="figure__large${data.inline ? ` figure__inline figure__inline--landscape ${data.classes}` : ''}"${getPagebreakAttribute(data)}>
                <figure id="${data.id}">

                    <div class="img-wrap">

                        <div class="audio">
                            <audio ${data.attrString}>
                                ${data.sourceElements}
                                <div class="media__fallback__${data.mediaType} media__fallback--image figure__small--landscape figure__small">
                                    <figure>
                                        <img src="${data.poster}" alt="Media fallback image"/>
                                    </figure>
                                </div>
                                <p class="media__fallback__${data.mediaType} media__fallback--text">Your device does not support the HTML5 ${data.mediaType} API.</p>
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
            <div class="figure__large${data.inline ? ` figure__inline figure__inline--landscape ${data.classes}` : ''}"${getPagebreakAttribute(data)}>
                <figure id="${data.id}">

                    <div class="img-wrap">

                        <div class="video">
                            <video ${data.attrString}>
                                ${data.sourceElements}
                                <div class="media__fallback__${data.mediaType} media__fallback--image figure__small--landscape figure__small">
                                    <figure>
                                        <img src="${data.poster}" alt="Media fallback image"/>
                                    </figure>
                                </div>
                                <p class="media__fallback__${data.mediaType} media__fallback--text">Your device does not support the HTML5 ${data.mediaType} API.</p>
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
            <div class="figure__large${data.inline ? ` figure__inline figure__inline--landscape ${data.classes}` : ''}"${getPagebreakAttribute(data)}>
                <figure id="${data.id}">
                    <div class="img-wrap">
                        <div class="iframe">
                            <iframe src="${encodeQueryString(data.source)}" />
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
