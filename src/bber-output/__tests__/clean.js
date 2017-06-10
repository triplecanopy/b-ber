'use strict'

// npm run -s mocha:single -- ./src/bber-output/__tests__/clean.js

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised') // eslint-disable-line no-unused-vars
const fs = require('fs-extra')
const path = require('path')
const clean = require('../clean').default
const store = require('../../bber-lib/store').default
const loader = require('../../bber-lib/loader').default
const Logger = require('../../__tests__/helpers/console')

chai.should()
chai.use(chaiAsPromised)

describe('module:clean', () => {
  let logger
  before(() => {
    loader(() => ({}))
    logger = new Logger()
    return logger
  })

  beforeEach(() => {
    logger.reset()
    return logger
  })

  describe('#clean', () => {
    it('Should remove the output directory supplied by `dist()`', () => {
      const dir = path.join(process.cwd(), 'src/__tests__/.tmp/clean')
      fs.mkdirs(dir, (err0) => {
        if (err0) { throw err0 }
        fs.existsSync(dir).should.be.true // eslint-disable-line no-unused-expressions
        return clean(dir).then(() =>
          fs.existsSync(dir).should.be.false
        ).catch((err1) => {
          throw err1
        })
      })
    })
    it('Should report an error if there is no directory specified', () => {
      store.update('build', null)
      return clean().catch((err) => {
        err.should.match(/TypeError:/)
        logger.errors.should.have.length(1)
        logger.errors[0].message.should.match(/TypeError:/)
      })
    })
  })
})
