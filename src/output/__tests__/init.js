
// npm run -s mocha:single -- ./src/output/__tests__/init.js

const chai = require('chai')
const sinon = require('sinon') // eslint-disable-line no-unused-vars
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const fs = require('fs-extra')
const path = require('path')

const should = chai.should() // eslint-disable-line no-unused-vars
chai.use(chaiAsPromised)
chai.use(sinonChai)

const loader = require('../../lib/loader').default
const store = require('../../lib/store').default
const Initialize = require('../init').default

const { log } = require('../../plugins') // eslint-disable-line no-unused-vars

const configYml = path.join(process.cwd(), 'config.yml')

const Logger = require('../../__tests__/helpers/console')

let init
let logger

describe('module:init', () => {
  before(() => {
    logger = new Logger()
    return logger
  })
  beforeEach(() => {
    store.update('build', 'epub')
    init = new Initialize()
    return init
  })

  beforeEach(() => {
    if (!fs.existsSync(configYml)) {
      fs.writeFileSync(configYml, '---\nenv: development # development | production\ntheme: default # name or path\nsrc: _book\ndist: book') // eslint-disable-line max-len
    }
  })

  describe('#makeNewEbookTemplate', () => {
    it('Creates the initial source directory structure', () => {
      const checkDirs = () => init.dirs.map(_ => fs.existsSync(_))
      const checkFiles = () => init.files.map(_ => fs.existsSync(_.relpath))
      return init.makeNewEbookTemplate(init.files).then(() => {
        checkDirs().should.not.contain(false)
        checkFiles().should.not.contain(false)
      })
    })
  })

  describe('#cleanCSSDir', () => {
    it('Removes the `_stylesheets` directory in the source directory', () => {
      const cssDir = path.join(init.src, '_stylesheets')
      before(() => fs.mkdirp(cssDir))
      init.cleanCSSDir().then(() =>
        fs.existsSync(cssDir).should.be.false
      )
    })
  })

  describe('#removeConfigFile', () => {
    it('Should should prompt the user if a `config.yml` exists in the project\'s root path', () =>
      init.removeConfigFile().then(() => {
        logger.warnings.should.have.length(1)
        logger.warnings[0].message.should.match(/It looks like this is an active project directory/)
      })
    )

    it('Should remove `config.yml` in the project\'s root path', () =>
      init.removeConfigFile().then(() =>
        fs.existsSync(configYml).should.be.false
      )
    )
  })

  describe('#init', () => {
    it('Initializes the promise chain', () =>
      init.init().should.eventually.be.fulfilled
    )
  })
})
