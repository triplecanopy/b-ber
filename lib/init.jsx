
import fs from 'fs-extra'
import yargs from 'yargs'
import path from 'path'
import { guid } from './utils'

const init = () => {
  const src = yargs.argv.src
  const dist = yargs.argv.dist

  const dirs = [
    `${src}`,
    `${src}/_images`,
    `${src}/_javascripts`,
    `${src}/_stylesheets`,
    `${src}/_markdown`,
    `${src}/.tmp`
  ]

  const files = [{
    name: 'config.yml',
    content: `---
environment: development
src: ${src}
dist: ${dist}`
  }, {
    name: 'metadata.yml',
    content: `---
metadata:
  title: Test Book
  creator: First Last
  language: en-US
  rights: © First Last
  publisher: Publisher Name
  contributor: Contributor 1
  contributor: Contributor 2
  contributor: Contributor 3
  identifier: ${guid()}
  cover_file: cover.jpg
  cover_path: _images/cover.jpg`
  }, {
    name: '.jshintrc',
    content: '{}'
  }]

  // TODO: don't rewrite if src dir exists
  dirs.map((dir, idx) =>
    fs.mkdirs(path.join(__dirname, '../', dir), () => {
      if (idx === dirs.length - 1) {
        files.map(_ =>
          fs.writeFile(`${src}/${_.name}`, _.content, (err2) => {
            if (err2) { throw err2 }
          })
        )
      }
    })
  )
}

export default init
