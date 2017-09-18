const id = () => String(Math.random()).slice(2)
const source = key => ({
    image: 'my-image.jpg',
    audio: 'sample-audio',
    video: 'sample-video',
}[key])
const notes = (key, name = '') => ({
    media: `Additionaly, the \`${name}\` attribute supports the following boolean attributes:
<table>
<thead><tr><th>Name</th><th>Values</th></tr></thead>
<tr><td><code>autoplay</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>loop</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>muted</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>preload</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>autobuffer</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>buffered</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>mozCurrentSampleOffset</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>played</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>volume</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>crossorigin</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>height</code></td><td><code>yes | no</code></td></tr>
<tr><td><code>width</code></td><td><code>yes | no</code></td></tr>
</table>`}[key])

const syntaxFor = key => ({
    caption: '\n:: Here is a caption using *Markdown*.<br/>HTML is supported here too.\n::',
    dialogue: '\n:: First Person :: Hello...\n\n:: Second Person :: World!\n'
}[key])


const SUPPORTED_ATTRIBUTES = [
    'title',
    'classes',
    'pagebreak',
    'alt',

    'citation',
    'source',

    // 'attributes', // ?

    'poster',
    'autoplay',
    'loop',
    'controls',
    'muted',
    'preload',
    'autobuffer',
    'buffered',
    'mozCurrentSampleOffset',
    'played',
    'volume',
    'crossorigin',
    'height',
    'width',
]


const genericContainerDirective = {
    section: {
        required: [{ id: id() }],
        supplementaryOutputRepository: false, // the name of the object in the `store` object that will contain supplementarily generated content, if any; i.e., the `figures` object
        syntaxVariants: false,
        selfClosing: false,
        optional: [{
            name: 'title',
            value: '"foo"',
            output: 'title="foo"',
        }, {
            name: 'classes',
            value: '"foo bar baz"',
            output: 'class="foo bar baz',
        }, {
            name: 'pagebreak',
            value: 'before',
            output: 'style="page-break-before:always;"',
        }, {
            name: 'pagebreak',
            value: 'after',
            output: 'style="page-break-after:always;"',
        }],
    },
}


const figureDirective = {
    required: [{
        id: id(),
    }, {
        source: source('image'),
    }],
    supplementaryOutputRepository: 'figures',
    syntaxVariants: syntaxFor('caption'),
    selfClosing: true,
    optional: [{
        name: 'title',
        value: '"foo"',
        output: 'title="foo"',
    }, {
        name: 'classes',
        value: '"foo bar baz"',
        output: 'class="foo bar baz',
    }, {
        name: 'pagebreak',
        value: 'before',
        output: 'style="page-break-before:always;"',
    }, {
        name: 'pagebreak',
        value: 'after',
        output: 'style="page-break-after:always;"',
    }, {
        name: 'alt',
        value: '"My Alt Text"',
        output: 'alt="My Alt Text"',
    }],
}


const figureInlineDirective = {
    required: [{
        id: id(),
    }, {
        source: source('image'),
    }],
    supplementaryOutputRepository: false,
    syntaxVariants: syntaxFor('caption'),
    selfClosing: true,
    optional: [{
        name: 'title',
        value: '"foo"',
        output: 'title="foo"',
    }, {
        name: 'classes',
        value: '"foo bar baz"',
        output: 'class="foo bar baz',
    }, {
        name: 'pagebreak',
        value: 'before',
        output: 'style="page-break-before:always;"',
    }, {
        name: 'pagebreak',
        value: 'after',
        output: 'style="page-break-after:always;"',
    }, {
        name: 'alt',
        value: '"My Alt Text"',
        output: 'alt="My Alt Text"',
    }],
}


const dialogueDirective = {
    required: [{
        id: id(),
    }],
    supplementaryOutputRepository: false,
    syntaxVariants: syntaxFor('dialogue'),
    selfClosing: false,
    optional: [{
        name: 'title',
        value: '"foo"',
        output: 'title="foo"',
    }, {
        name: 'pagebreak',
        value: 'before',
        output: 'style="page-break-before:always;"',
    }, {
        name: 'pagebreak',
        value: 'after',
        output: 'style="page-break-after:always;"',
    }],
}

// const footnotesDirective = {
//     required: [{}],
//     supplementaryOutputRepository: 'notes',
//     syntaxVariants: false,
//     selfClosing: false,
//     optional: [{}],
// }


const videoDirective = {
    required: [{
        id: id(),
    }, {
        source: source('video'),
    }, {
        poster: source('image'),
    }],
    supplementaryOutputRepository: 'figures',
    syntaxVariants: syntaxFor('caption'),
    selfClosing: true,
    optional: [{
        name: 'title',
        value: '"foo"',
        output: 'title="foo"',
    }, {
        name: 'classes',
        value: '"foo bar baz"',
        output: 'class="foo bar baz',
    }, {
        name: 'pagebreak',
        value: 'before',
        output: 'style="page-break-before:always;"',
    }, {
        name: 'pagebreak',
        value: 'after',
        output: 'style="page-break-after:always;"',
    }, {
        name: 'poster',
        value: source('image'),
        output: `poster="${source('image')}"`,
    }, {
        name: 'controls',
        value: 'yes',
        output: 'controls="controls"',
    }, {
        name: 'controls',
        value: 'no',
        output: '',
    }],
    notes: notes('media', 'video')
}


const videoInlineDirective = {
    required: [{
        id: id(),
    }, {
        source: source('video'),
    }],
    supplementaryOutputRepository: false,
    syntaxVariants: syntaxFor('caption'),
    selfClosing: true,
    optional: [{
        name: 'title',
        value: '"foo"',
        output: 'title="foo"',
    }, {
        name: 'classes',
        value: '"foo bar baz"',
        output: 'class="foo bar baz',
    }, {
        name: 'pagebreak',
        value: 'before',
        output: 'style="page-break-before:always;"',
    }, {
        name: 'pagebreak',
        value: 'after',
        output: 'style="page-break-after:always;"',
    }, {
        name: 'poster',
        value: source('image'),
        output: `poster="${source('image')}"`,
    }, {
        name: 'controls',
        value: 'yes',
        output: 'controls="controls"',
    }, {
        name: 'controls',
        value: 'no',
        output: '',
    }],
    notes: notes('media', 'video-inline')
}

const audioDirective = {
    required: [{
        id: id(),
    }, {
        source: source('audio'),
    }, {
        poster: source('image'),
    }],
    supplementaryOutputRepository: 'figures',
    syntaxVariants: syntaxFor('caption'),
    selfClosing: true,
    optional: [{
        name: 'title',
        value: '"foo"',
        output: 'title="foo"',
    }, {
        name: 'classes',
        value: '"foo bar baz"',
        output: 'class="foo bar baz',
    }, {
        name: 'pagebreak',
        value: 'before',
        output: 'style="page-break-before:always;"',
    }, {
        name: 'pagebreak',
        value: 'after',
        output: 'style="page-break-after:always;"',
    }, {
        name: 'controls',
        value: 'yes',
        output: 'controls="controls"',
    }, {
        name: 'controls',
        value: 'no',
        output: '',
    }],
    notes: notes('media', 'audio')
}

const audioInlineDirective = {
    required: [{
        id: id(),
    }, {
        source: source('audio'),
    }],
    supplementaryOutputRepository: false,
    syntaxVariants: syntaxFor('caption'),
    selfClosing: true,
    optional: [{
        name: 'title',
        value: '"foo"',
        output: 'title="foo"',
    }, {
        name: 'classes',
        value: '"foo bar baz"',
        output: 'class="foo bar baz',
    }, {
        name: 'pagebreak',
        value: 'before',
        output: 'style="page-break-before:always;"',
    }, {
        name: 'pagebreak',
        value: 'after',
        output: 'style="page-break-after:always;"',
    }, {
        name: 'poster',
        value: source('image'),
        output: `poster="${source('image')}"`,
    }, {
        name: 'controls',
        value: 'yes',
        output: 'controls="controls"',
    }, {
        name: 'controls',
        value: 'no',
        output: '',
    }],
    notes: notes('media', 'audio-inline')
}



const logoDirective = {
    required: [{
        id: id(),
    }, {
        source: source('image')
    }],
    optional: [{}], // needs length to force render in `__tests__/directives.js`
    supplementaryOutputRepository: false,
    syntaxVariants: false,
    selfClosing: true,
}



const DIRECTIVE_SPEC = {
    halftitlepage   : Object.assign({}, genericContainerDirective.section),
    titlepage       : Object.assign({}, genericContainerDirective.section),
    dedication      : Object.assign({}, genericContainerDirective.section),
    // epigraph        : Object.assign({}, genericContainerDirective.section), // TODO: malformed?
    foreword        : Object.assign({}, genericContainerDirective.section),
    preface         : Object.assign({}, genericContainerDirective.section),
    acknowledgments : Object.assign({}, genericContainerDirective.section),
    introduction    : Object.assign({}, genericContainerDirective.section),
    prologue        : Object.assign({}, genericContainerDirective.section),
    chapter         : Object.assign({}, genericContainerDirective.section),
    subchapter      : Object.assign({}, genericContainerDirective.section),
    epilogue        : Object.assign({}, genericContainerDirective.section),
    afterword       : Object.assign({}, genericContainerDirective.section),
    conclusion      : Object.assign({}, genericContainerDirective.section),
    loi             : Object.assign({}, genericContainerDirective.section),
    appendix        : Object.assign({}, genericContainerDirective.section),
    seriespage      : Object.assign({}, genericContainerDirective.section),
    credits         : Object.assign({}, genericContainerDirective.section),
    contributors    : Object.assign({}, genericContainerDirective.section),
    colophon        : Object.assign({}, genericContainerDirective.section),
    volume          : Object.assign({}, genericContainerDirective.section),
    part            : Object.assign({}, genericContainerDirective.section),
    dialogue        : Object.assign({}, dialogueDirective),
    // footnotes       : Object.assign({}, footnotesDirective),
    figure          : Object.assign({}, figureDirective),
    'inline-figure' : Object.assign({}, figureInlineDirective),
    audio           : Object.assign({}, audioDirective),
    'audio-inline'  : Object.assign({}, audioInlineDirective),
    video           : Object.assign({}, videoDirective),
    'video-inline'  : Object.assign({}, videoInlineDirective),
    logo            : Object.assign({}, logoDirective),
}


export { DIRECTIVE_SPEC }
