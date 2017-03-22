
// npm run -s mocha:single -- ./src/lib/__tests__/store.js

require('chai').should() // eslint-disable-line import/no-extraneous-dependencies
const store = require('../store').default

describe('Store', () => {
  beforeEach(() => store.reset())

  describe('#_checkTypes', () => {
    it('Should ensure that input parameters are valid', () =>
      (() => store.add('foo', 'bar')).should.throw(TypeError)
    )
  })
  describe('#add', () => {
    it('Should add an item to an array or object', () => {
      const a = 1
      const o = { foo: 1 }
      store.add('pages', a)
      store.add('bber', o)
      store.pages.should.have.length(1)
      store.bber.should.have.key('foo')
    })
  })
  describe('#remove', () => {
    before(() => {
      store.add('pages', 'foo')
      store.add('bber', { foo: 1 })
    })
    it('Should remove an item from an array or object', () => {
      store.remove('pages', 'foo')
      store.remove('bber', 'foo')
      store.pages.should.be.empty
      store.bber.should.be.empty
    })
  })
  describe('#merge', () => {
    it('Should merge two objects', () => {
      store.add('bber', { foo: 1 })
      store.merge('bber', { bar: 2 })
      store.bber.should.have.all.keys('foo', 'bar')
    })
  })
  describe('#update', () => {
    before(() => store.add('pages', 'foo'))
    it('Should set the value of a property', () => {
      store.update('pages', ['bar'])
      store.pages.should.have.length(1)
      store.pages.should.contain('bar')
    })
  })
})
