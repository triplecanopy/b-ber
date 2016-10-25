
import gulp from 'gulp'
import fs from 'fs'
import path from 'path'
import cssnano from 'cssnano'
import sass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'

import conf from './config'

const stylesheet = path.join(__dirname, `../${conf.src}`, '_stylesheets/application.scss')
const sassOptions = { file: stylesheet, errLogToConsole: true, outputStyle: 'nested' }
const autoprefixerOptions = { browsers: ['last 2 versions', '> 2%'], flexbox: 'no-2009' }

gulp.task('sass', () =>
  sass.render(sassOptions, (err1, result) => {
    if (err1) { throw err1 }
    postcss([
      autoprefixer(autoprefixerOptions),
      cssnano
    ])
      .process(result.css)
      .then(prefixed =>
        fs.writeFile(`${conf.dist}/OPS/stylesheets.css`, prefixed, (err2) => {
          if (err2) { throw err2 }
          console.log('sass done')
        })
      )
  })
)
