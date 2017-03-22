'use strict'

// npm run -s mocha:single -- ./src/lib/__tests__/config.js

const should = require('chai').should() // eslint-disable-line no-unused-vars
const Config = require('../config').default
const loader = require('../loader').default

describe('Configuration', () => {
  describe('#constructor', () => {
    it('Should create a new Configuration instance', () =>
      loader(instance => instance.should.be.an.instanceOf(Config))
    )
  })
})

describe('module:loader', () => {
  describe('#loader', () => {
    it('Should instantiate a new Configuration instance with default properties', () =>
      loader((instance) => {
        instance._config.should.be.an('object')
        return instance._config.src.should.equal('_book')
      })
    )
  })
})
