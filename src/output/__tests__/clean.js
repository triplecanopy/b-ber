
// npm run -s mocha:single -- ./src/output/__tests__/clean.js

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised') // eslint-disable-line no-unused-vars
const fs = require('fs-extra')
const path = require('path')
const clean = require('../clean').default
const store = require('../../lib/store').default
const loader = require('../../lib/loader').default
const Logger = require('../../__tests__/helpers/console')

const should = chai.should() // eslint-disable-line no-unused-vars, import/no-extraneous-dependencies
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
      store.update('build', 'epub')
      const dir = path.join(process.cwd(), 'src/__tests__/.tmp/clean')
      fs.ensureDirSync(dir)
      return clean(dir).then(() =>
        fs.existsSync(path.join(process.cwd(), 'book-epub')).should.be.false
      ).catch((err) => {
        throw err
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
