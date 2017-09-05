
/* eslint-disable max-len */

const mobi = {
    portrait: function(data) {
        return `<div class="figure__large${ data.inline ? 'figure__inline' : '' }"${data.pagebreak ? ` style="page-break-${data.pagebreak}:always;"` : ''}>
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
    landscape: function(data) {
        return `<div class="figure__large${ data.inline ? 'figure__inline' : '' }"${data.pagebreak ? ` style="page-break-${data.pagebreak}:always;"` : ''}>
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
    'portrait-high': function(data) {
        return `<div class="figure__large${ data.inline ? 'figure__inline' : '' }"${data.pagebreak ? ` style="page-break-${data.pagebreak}:always;"` : ''}>
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
    square: function(data) {
        return `<div class="figure__large${ data.inline ? 'figure__inline' : '' }"${data.pagebreak ? ` style="page-break-${data.pagebreak}:always;"` : ''}>
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
    audio: function(data) {
        return `
            <div class="figure__large">
                <figure id="${ data.id }">

                    <div class="img-wrap">

                        <section class="audio">
                            <audio ${ data.attrString }>
                                ${ data.sourceElements }
                                <p>Your device does not support the HTML5 Audio API.</p>
                            </audio>
                        </section>

                        <div class="figcaption" style="max-width: 100%;">
                            <p class="small">
                                ${ data.caption ? `${ data.caption }<br/>` : '' }
                                <a href="${ data.ref }.xhtml#ref${ data.id }">\u21B5</a>
                            </p>
                        </div>

                    </div>

                </figure>
            </div>`
    },
    video: function(data) {
        return `
            <div class="figure__large">
                <figure id="${ data.id }">

                    <div class="img-wrap">

                        <section class="video">
                            <video ${ data.attrString }>
                                ${ data.sourceElements }
                                <p>Your device does not support the HTML5 Video API.</p>
                            </video>
                        </section>

                        <div class="figcaption" style="max-width: 100%;">
                            <p class="small">
                                ${ data.caption ? `${ data.caption }<br/>` : '' }
                                <a href="${ data.ref }.xhtml#ref${ data.id }">\u21B5</a>
                            </p>
                        </div>

                    </div>

                </figure>
            </div>`
    },
}

export default mobi
