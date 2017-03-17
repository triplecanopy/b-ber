
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const utils = require('../utils')

const { opspath, cjoin, fileid, copy, guid, rpad, lpad, hrtimeformat, hashIt,
  updateStore, getImageOrientation, getFrontmatter, orderByFileName, entries,
  src, dist, build, env, theme, version, metadata, promiseAll } = utils

describe('utils', () => {
  describe('#cjoin', () => {
    it('Should remove falsey values from an array and join the elements with newlines', () => {
      cjoin(['foo', false, 'bar', 0, null, 'baz', '']).should.equal('foo\nbar\nbaz')
    })
  })

  describe('#getImageOrientation', () => {
    it('Calculates the ratio an image and return the appropriate class name', () => {
      getImageOrientation(2, 2).should.equal('square')
      getImageOrientation(2, 1).should.equal('landscape')
      getImageOrientation(4, 5).should.equal('portrait')
      getImageOrientation(1, 2).should.equal('portraitLong')
    })
  })

  describe('#promiseAll', () => {
    it('Is a convenience wrapper around `Promise.all`', () => {
      const p1 = Promise.resolve('foo')
      const p2 = Promise.resolve('bar')
      return promiseAll([p1, p2]).then((resp) => {
        resp.should.be.an('array')
        resp.should.have.length(2)
        resp[0].should.equal('foo')
        resp[1].should.equal('bar')
      })
    })
  })
})
