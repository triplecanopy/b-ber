/* eslint-disable import/prefer-default-export */

const build = [
    'clean',
    'container',
    'cover',
    'sass',
    'copy',
    'scripts',
    'render',
    'loi',
    'footnotes',
    'inject',
    'opf',
]


const sequences = {
    epub: [
        ...build,
        'epub',
    ],
    mobi: [
        ...build,
        'mobiCSS',
        'mobi',
    ],
    pdf: [
        ...build,
        'pdf',
    ],
    web: [
        ...build,
        'web',
    ],
    sample: [
        ...build,
        'sample',
    ],
}


export { sequences }
