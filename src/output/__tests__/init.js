'use strict'

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
const Logger = require('../../__tests__/helpers/console')

const cwd = process.cwd()
const configYml = path.join(cwd, 'config.yml')
const projectDir = path.join(cwd, '_book')
const yamlStr = '---\nenv: development # development | production\ntheme: default # name or path\nsrc: _book\ndist: book' // eslint-disable-line max-len

let init
let logger

describe('module:init', () => {
  before(() => {
    logger = new Logger()
    return logger
  })
  beforeEach(() => {
    if (!fs.existsSync(configYml)) {
      fs.writeFileSync(configYml, yamlStr)
    }
    loader(() => {
      store.update('build', 'epub')
      init = new Initialize()
      return init
    })
    logger.reset()
    return init
  })

  describe('#_removeConfigFile', () => {
    it('Should should prompt the user if a `config.yml` exists in the project\'s root path', () =>
      init._removeConfigFile().then(() => {
        logger.warnings.should.have.length(1)
        return logger.warnings[0].message.should.match(/It looks like/)
      })
    )

    it('Should remove `config.yml` in the project\'s root path', () =>
      init._removeConfigFile().then(() =>
        fs.existsSync(configYml).should.be.false
      )
    )
  })

  describe('#_removeDirs', () => {
    it('Should remove existing project directories', () =>
      init._removeDirs().then(() =>
        fs.existsSync(projectDir).should.be.false
      )
    )
  })

  describe('#_makeDirs', () => {
    it('Should create the default project directories', () =>
      init._makeDirs().then(() =>
        fs.readdirSync(projectDir).should.have.length(6)
      )
    )
  })

  describe('#_writeFiles', () => {
    it('Should write the default project files', () =>
      init._writeFiles().then(() =>
        fs.readdirSync(projectDir).should.have.length(11)
      )
    )
  })

  describe('#init', () => {
    it('Initializes the promise chain', () =>
      init.init().should.eventually.be.fulfilled
    )
  })
})
