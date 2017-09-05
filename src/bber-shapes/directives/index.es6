const BLOCK_DIRECTIVE_MARKER = ':'
const INLINE_DIRECTIVE_MARKER = ':'
const BLOCK_DIRECTIVE_MARKER_MIN_LENGTH = 3
const INLINE_DIRECTIVE_MARKER_MIN_LENGTH = 3

const BLOCK_DIRECTIVE_FENCE = `${BLOCK_DIRECTIVE_MARKER.repeat(BLOCK_DIRECTIVE_MARKER_MIN_LENGTH)} `
const INLINE_DIRECTIVE_FENCE = `${INLINE_DIRECTIVE_MARKER.repeat(INLINE_DIRECTIVE_MARKER_MIN_LENGTH)} `

// block
const FRONTMATTER_DIRECTIVES = [
    'frontmatter',
    'halftitlepage',
    'titlepage',
    'dedication',
    'epigraph',
    'foreword',
    'preface',
    'acknowledgments',
]
const BODYMATTER_DIRECTIVES = [
    'bodymatter',
    'introduction',
    'prologue',
    'chapter',
    'subchapter',
    'epilogue',
    'conclusion',
]
const BACKMATTER_DIRECTIVES = [
    'backmatter',
    'afterword',
    'loi',
    'appendix',
    'seriespage',
    'credits',
    'contributors',
    'colophon',
]

// inline
const INLINE_DIRECTIVES = [
    'figure',
    'inline-figure',
    'logo',
    'video',
    'audio',
    'video-inline',
    'audio-inline',
]

// misc
const MISC_DIRECTIVES = [
    'pull-quote',
    'dialogue',
    'epigraph',
]

// unions
const BLOCK_DIRECTIVES = [...FRONTMATTER_DIRECTIVES, ...BODYMATTER_DIRECTIVES, ...BACKMATTER_DIRECTIVES]
const ALL_DIRECTIVES = [...BLOCK_DIRECTIVES, ...INLINE_DIRECTIVES, ...MISC_DIRECTIVES]

const DIRECTIVE_ATTRIBUTES = {
    section: {
        required: {},
        optional: {
            title: {
                input: 'title:"foo"',
                output: 'title="foo"',
            },
            classes: {
                input: 'classes:"foo bar baz"',
                output: 'class="foo bar baz',
            },
            pagebreak: [{
                input: 'pagebreak:before',
                output: 'style="page-break-before:always;"',
            }, {
                input: 'pagebreak:after',
                output: 'style="page-break-always:always;"',
            }],
        },
    },

    figure: {
        required: {
            source: {
                input: 'source:foo.jpg',
                output: 'src="foo.jpg"',
            },
        },
        optional: {
            alt: {
                input: 'alt:foo',
                output: 'alt="foo"',
            },
            classes: {
                input: 'classes:"foo bar baz"',
                output: 'class="foo bar baz',
            },
        },
    },

    // misc
    misc: {
        'pull-quote': {
            required: {},
            optional: {
                citation: {
                    input: 'citation:"foo bar"',
                    output: /<cite>&#8212;&#160;foo bar<\/cite>/,
                },
                classes: {
                    input: 'classes:"foo bar baz"',
                    output: /class="pull-quote foo bar baz/,
                },
            },
        },
        dialogue: {
            required: {},
            optional: {},
        },
        // 'epigraph': {
        //   required: {},
        //   optional: {}
        // }
    },

    // // audio/video
    // video: {
    //   required: {
    //     source: {
    //       input: 'source:foo.mp4',
    //       output: /<source src="foo.mp4" type="video\/mp4"/
    //     }
    //   },
    //   optional: {
    //     poster: {
    //       input: 'poster:foo.jpg',
    //       output: 'poster="foo.jpg"'
    //     },
    //     autoplay: {
    //       input: 'autoplay:yes',
    //       output: 'autoplay="autoplay"'
    //     },
    //     loop: {
    //       input: 'loop:yes',
    //       output: 'loop="loop"'
    //     },
    //     controls: {
    //       input: 'controls:yes',
    //       output: 'controls="controls"'
    //     },
    //     muted: {
    //       input: 'muted:yes',
    //       output: 'muted="muted"'
    //     }
    //   }
    // },

    // audio: {
    //   required: {
    //     source: {
    //       input: 'source:foo.mp3',
    //       output: /<source src="foo.mp3" type="audio\/mp3"/
    //     }
    //   },
    //   optional: {
    //     autoplay: {
    //       input: 'autoplay:yes',
    //       output: 'autoplay="autoplay"'
    //     },
    //     loop: {
    //       input: 'loop:yes',
    //       output: 'loop="loop"'
    //     },
    //     controls: {
    //       input: 'controls:yes',
    //       output: 'controls="controls"'
    //     },
    //     muted: {
    //       input: 'muted:yes',
    //       output: 'muted="muted"'
    //     }
    //   }
    // },

    // wildcard
    // attrs: { input: '',  output: '' },
}

const GLOBAL_ATTRIBUTES = ['id']

const SUPPORTED_ATTRIBUTES = [
    'title',
    'classes',
    'pagebreak',
    'attributes',
    'alt',
    'citation',
    'source',
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
    // 'attrs',
]


const DIRECTIVES_REQUIRING_ALT_TAG = [
    'figure',
    'inline-figure',
    'logo',
]


export {
    BLOCK_DIRECTIVE_MARKER,
    INLINE_DIRECTIVE_MARKER,
    BLOCK_DIRECTIVE_FENCE,
    INLINE_DIRECTIVE_FENCE,
    BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
    INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    FRONTMATTER_DIRECTIVES,
    BODYMATTER_DIRECTIVES,
    BACKMATTER_DIRECTIVES,
    BLOCK_DIRECTIVES,
    INLINE_DIRECTIVES,
    MISC_DIRECTIVES,
    DIRECTIVE_ATTRIBUTES,
    GLOBAL_ATTRIBUTES,
    ALL_DIRECTIVES,
    SUPPORTED_ATTRIBUTES,
    DIRECTIVES_REQUIRING_ALT_TAG,
}
