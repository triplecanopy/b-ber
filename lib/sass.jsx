
// Could set up themes to be loaded through custom `importer()`, not necessary for
// now though see: https://github.com/sass/node-sass#render-callback--v300

import fs from 'fs-extra'
import path from 'path'
import nsass from 'node-sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import conf from './config'

const cwd = process.cwd()
const destdir = path.join(cwd, conf.dist, '/OPS/stylesheets')
const outputStyle = conf.env === 'production' ? 'compressed' : 'nested'
const autoprefixerOptions = { browsers: ['last 2 versions', '> 2%'], flexbox: 'no-2009' }
const stylesheet = path.join(cwd, conf.src, '_stylesheets/application.scss')

// TODO: build env from config should be passed in through yargs
const build = conf.build || 'epub'
const buildVars = `$build: "${build}";`
const includePaths = [path.join(cwd, conf.src, '_stylesheets/')]

const sassOptions = () =>
  new Promise((resolve, reject) =>
    fs.readFile(stylesheet, (err, buffer) => {
      if (err) { throw err }
      const data = `${buildVars}\n${buffer.toString()}`
      resolve({ data, includePaths, outputStyle, errLogToConsole: true })
    })
  )

const createdir = () =>
  new Promise((resolve, reject) =>
    fs.mkdirs(destdir, (err) => {
      if (err) { reject(err) }
      resolve(destdir)
    })
  )

async function sass() {
  const outputdir = await createdir()
  const options = await sassOptions()
  return new Promise((resolve, reject) => {
    nsass.render(options, (err1, result) => {
      if (err1) { return reject(err1) }
      if (!result) { return reject('Sass: `result` cannot be null.') }
      return postcss(autoprefixer(autoprefixerOptions))
        .process(result.css)
        .then(prefixed =>
          fs.writeFile(path.join(outputdir, 'application.css'), prefixed, (err2) => {
            if (err2) { reject(err2) }
            resolve()
          })
        )
    })
  })
}

export default sass
