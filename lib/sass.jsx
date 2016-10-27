
import fs from 'fs-extra'
import path from 'path'
import cssnano from 'cssnano'
import nsass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'

import conf from './config'

const destdir = path.join(__dirname, '../', conf.dist, '/OPS/stylesheets')
const stylesheet = path.join(__dirname, `../${conf.src}`, '_stylesheets/application.scss')
const sassOptions = { file: stylesheet, errLogToConsole: true, outputStyle: 'nested' }
const autoprefixerOptions = { browsers: ['last 2 versions', '> 2%'], flexbox: 'no-2009' }

const createdir = () =>
  new Promise((resolve, reject) =>
    fs.mkdirs(destdir, (err) => {
      if (err) { reject(err) }
      console.log('resolve')
      resolve(destdir)
    })
  )

async function sass() {
  const outputdir = await createdir()
  return new Promise((resolve, reject) => {
    nsass.render(sassOptions, (err1, result) => {
      if (err1) { reject(err1) }
      postcss([autoprefixer(autoprefixerOptions), cssnano])
        .process(result.css)
        .then(prefixed =>
          fs.writeFile(path.join(outputdir, 'stylesheets.css'), prefixed, (err2) => {
            if (err2) { reject(err2) }
            resolve()
          })
        )
    })
  })
}

export default sass
