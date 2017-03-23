'use strict'

// npm run -s mocha:single -- ./src/bber-output/opf/__tests__/opf.js

const fs = require('fs-extra')
const path = require('path')

const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')

const should = chai.should() // eslint-disable-line no-unused-vars
chai.use(chaiAsPromised)
chai.use(sinonChai)

const loader = require('../../../bber-lib/loader').default
const store = require('../../../bber-lib/store').default
const Opf = require('../').default
const Logger = require('../../../__tests__/helpers/console')
const log = require('../../../bber-plugins').log

let logger
let opf = new Opf()

// setup
const cwd = process.cwd()
const dirs = {
  src: path.join(cwd, '_book'),
  dist: path.join(cwd, 'book-epub/OPS/text')
}
const files = {
  metadata: path.join(dirs.src, 'metadata.yml'),
  build: path.join(dirs.src, 'epub.yml'),
  content: ['1.xhtml', '2.xhtml', '3.xhtml']
}
const strings = {
  metadata: '---\n-\n  term: title\n  value: Book\n  term_property: title-type\n  term_property_value: main', // eslint-disable-line max-len
  build: '---\n- 1.xhtml\n- 2.xhtml\n- 3.xhtml',
  content: '<!DOCTYPE html><html><head><title></title></head><body></body></html>'
}

const removeAssets = (callback) => {
  fs.removeSync(dirs.src)
  fs.removeSync(path.join(cwd, 'book-epub'))
  return callback && typeof callback === 'function' ? callback() : 1
}

const createAssets = () => {
  for (const k in dirs) { // eslint-disable-line no-restricted-syntax
    if ({}.hasOwnProperty.call(dirs, k)) {
      if (fs.existsSync(dirs[k])) { fs.removeSync(dirs[k]) }
      fs.ensureDirSync(dirs[k])
    }
  }

  for (let i = 0; i < files.content.length; i++) {
    fs.writeFileSync(path.join(dirs.dist, files.content[i]), strings.content)
  }

  fs.writeFileSync(files.metadata, strings.metadata)
  fs.writeFileSync(files.build, strings.build)

  // add entries to store so that they're available in `navigation.jsx`


  return true
}

describe('module:opf', () => {
  before(() => {
    removeAssets(createAssets)
    logger = new Logger()
    return loader(() => {
      store.update('build', 'epub')
    })
  })

  after(() => removeAssets())

  beforeEach(() => {
    opf = new Opf()
    logger.reset()
    return opf
  })

  describe('#init', () => {
    it('Should return a formatted XML string', () =>
      opf.init().should.eventually.match(/<\?xml version="1.0" encoding="UTF-8"\?>/)
    )

    it('Should catch errors, log them to the console, and continue execution', () =>
      new Promise(resolve/* , reject */ =>
        Promise.all([
          Promise.resolve(1),
          Promise.resolve(2)
        ])
        .then(() => Promise.reject('foo'))
        .catch(err => log.error(err))
        .then(() => {
          logger.errors.should.have.length(1)
          logger.errors[0].message.should.equal('foo')
          resolve()
        }).should.eventually.be.fulfilled
      )
    )

    it('Should call the subordinate methods', () => {
      const promise1 = sinon.spy(opf, 'createOpfPackageString')
      const promise2 = sinon.spy(opf, 'writeOpfToDisk')
      return opf.init().then(() => {
        promise1.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        return promise2.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
      })
    })

    it('Should call the subordinate methods in the correct order', () => {
      const promise1 = sinon.spy(opf, 'createOpfPackageString')
      const promise2 = sinon.spy(opf, 'writeOpfToDisk')
      return opf.init().then(() =>
        promise1.should.have.been.calledBefore(promise2) // eslint-disable-line no-unused-expressions
      )
    })
  })

  describe('#createOpfPackageString', () => {
    it('Should create a formatted XML string from a JavaSript object')
  })

  describe('#writeOpfToDisk', () => {
    it('Should write a file to disk')
  })
})
