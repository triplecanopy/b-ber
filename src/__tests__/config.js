
require('chai').should()

const Config = require('../modules/config').default
const loader = require('../loader').default

describe('Configuration', () => {
  let config
  beforeEach(() => config = new Config())

  describe('#constructor', () => {
    it('Should create a new Configuration instance', () => {
      config.should.be.an.instanceOf(Config)
    })
  })
})


describe('loader', () => {
  describe('#loader', () => {
    it('Should create a new Configuration instance if one does not exist', () => {
      loader(resp => resp.should.be.an.instanceOf(Config))
    })
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
