
// npm run -s mocha:single -- ./src/lib/__tests__/config.js

const should = require('chai').should() // eslint-disable-line no-unused-vars, import/no-extraneous-dependencies
const Config = require('../config').default
const loader = require('../loader').default

describe('Configuration', () => {
  let config
  beforeEach(() => {
    config = new Config()
    return config
  })

  describe('#constructor', () => {
    it('Should create a new Configuration instance', () =>
      config.should.be.an.instanceOf(Config)
    )
  })
})

describe('module:loader', () => {
  describe('#loader', () => {
    it('Should create a new Configuration instance if one does not exist', () =>
      loader(resp => resp.should.be.an.instanceOf(Config))
    )
    it('Should instantiate a new Configuration instance with default properties', () => {
      loader((resp) => {
        resp.should.be.an.instanceOf(Config)
        resp._config.should.be.an('object')
        resp._config.src.should.equal('_book')
        resp._metadata.should.be.an('array')
        resp._metadata[0].should.be.an('object')
        resp._metadata[0].term.should.equal('title')
        resp._metadata[0].value.should.equal('Sample Book')
      })
    })
  })
})
