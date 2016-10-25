
// TODO: does this need to be wrapped in promise? ... probably not

import fs from 'fs'
import path from 'path'
import cssnano from 'cssnano'
import nsass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'

import conf from './config'

const stylesheet = path.join(__dirname, `../${conf.src}`, '_stylesheets/application.scss')
const sassOptions = { file: stylesheet, errLogToConsole: true, outputStyle: 'nested' }
const autoprefixerOptions = { browsers: ['last 2 versions', '> 2%'], flexbox: 'no-2009' }

const sass = () =>
  new Promise((resolve, reject) => {
    nsass.render(sassOptions, (err1, result) => {
      if (err1) { reject(err1) }
      postcss([
        autoprefixer(autoprefixerOptions),
        cssnano
      ])
      .process(result.css)
      .then(prefixed =>
        fs.writeFile(`${conf.dist}/OPS/stylesheets.css`, prefixed, (err2) => {
          if (err2) { reject(err2) }
          console.log('sass done')
          resolve()
        })
      )
    })
  })

export default sass
