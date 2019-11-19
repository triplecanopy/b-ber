export const build = [
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
  epub: [...build, 'epub'],
  mobi: [...build, 'mobiCSS', 'mobi'],
  pdf: [...build, 'pdf'],
  web: [...build, 'web'],
  sample: [...build, 'sample'],
  reader: [...build, 'reader'],
  xml: [...build, 'xml'],
}

export default sequences
