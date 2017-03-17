
/* eslint-disable no-unused-expressions */

const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const fs = require('fs-extra')
const path = require('path')

const should = chai.should() // eslint-disable-line no-unused-vars
chai.use(chaiAsPromised)
chai.use(sinonChai)

const bunyan = require('bunyan')
const loader = require('../loader').default
const actions = require('../state').default
const Initialize = require('../tasks/init').default

const { log, logg } = require('../log') // eslint-disable-line no-unused-vars

const cwd = process.cwd()

let init
let consoleErrors = []
let consoleWarnings = []

describe('module:init', () => {

  beforeEach(() => {
    loader((config) => {
      actions.setBber({ build: 'epub' })
      init = new Initialize()
    })

    consoleErrors = []
    consoleWarnings = []

    // send bunyan logging to arrays to validate in describe blocks
    bunyan.prototype.error = function(message) {
      consoleErrors.push({ message })
    }
    bunyan.prototype.warn = function(message) {
      consoleWarnings.push({ message })
    }
  })

  describe('#onLoopDone', () => {
    it('Waits until a loop has finished execution before firing', () => {
      const next = sinon.spy()
      const callback = sinon.spy(init, 'onLoopDone')
      const arr = [1, 2, 3]
      arr.map((_, i, a) => callback(i, a, next))

      next.should.have.been.calledOnce
      callback.should.have.been.calledThrice
    })
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
      init.cleanCSSDir().then(() => {
        fs.existsSync(cssDir).should.be.false
      })
    })
  })

  describe('#removeConfigFile', () => {
    it('Should should prompt the user if a `config.yml` exists in the project\'s root path', () => {
      const configYml = path.join(cwd, 'config.yml')
      before(() => {
        if (!fs.existsSync(configYml)) {
          fs.writeFileSync(configYml, '')
        }
      })

      return init.removeConfigFile().then(() => {
        consoleWarnings.should.have.length(1)
        consoleWarnings[0].message.should.match(/It looks like this is an active project directory/)
      })

    })
    it('Should remove `config.yml` in the project\'s root path', () => {
      const configYml = path.join(cwd, 'config.yml')
      before(() => {
        if (!fs.existsSync(configYml)) {
          fs.writeFileSync(configYml, '')
        }
      })

      return init.removeConfigFile().then(() => {
        fs.existsSync(configYml).should.be.false
      })
    })
  })

  describe('#init', () => {
    it('Initializes the promise chain', () => {
      init.init().then(() =>
        // re-generate config.yml
        fs.writeFileSync(path.join(cwd, 'config.yml'), '---\nenv: development # development | production\ntheme: default # name or path\nsrc: _book\ndist: book-epub') // eslint-disable-line max-len
      ).should.eventually.be.fulfilled
    })
  })
})
