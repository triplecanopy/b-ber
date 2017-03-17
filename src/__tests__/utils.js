
const chai = require('chai')
const should = chai.should()
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const utils = require('../utils')

const { opsPath, cjoin, fileId, copy, guid, rpad, lpad, hrtimeformat, hashIt,
  updateStore, getImageOrientation, getFrontmatter, orderByFileName, entries,
  src, dist, build, env, theme, version, metadata, promiseAll } = utils

describe('module:utils', () => {
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


  describe('#copy', () => {
    it('Copies assets from one location to another')
  })
  describe('#opsPath', () => {
    it('Returns the path to the OPS directory relative to a file')
  })
  describe('#fileId', () => {
    it('Creates an HTML-safe element id')
  })
  // describe('#s4', () => {
  //   it('')
  // })
  describe('#guid', () => {
    it('Generates a GUID')
  })
  describe('#rpad', () => {
    it('Pads a string from the right')
  })
  describe('#lpad', () => {
    it('Pads a string from the left')
  })
  describe('#hrtimeformat', () => {
    it('Formats `process.hrtime` in ms')
  })
  describe('#hashIt', () => {
    it('Creates a hash from a string')
  })
  describe('#updateStore', () => {
    it('Updates the global store')
  })
  describe('#getFrontmatter', () => {
    it('Retrieves a file\'s frontmatter from the global store')
  })
  describe('#orderByFileName', () => {
    it('Orders a list of objects by the `name` property')
  })
  describe('#entries', () => {
    it('Creates an iterator from a JavaScript object')
  })
  describe('#getVal', () => {
    it('Retrieves a value from the global store\'s `bber` property')
  })
  describe('#src', () => {
    it('Retrieves the `src` directory from the global store')
  })
  describe('#dist', () => {
    it('Retrieves the `dist` directory from the global store')
  })
  describe('#build', () => {
    it('Retrieves the `build` property from the global store')
  })
  describe('#env', () => {
    it('Retrieves the `env` property from the global store')
  })
  describe('#theme', () => {
    it('Retrieves the `theme` directory from the global store')
  })
  describe('#metadata', () => {
    it('Retrieves the `metadata` property from the global store')
  })
  describe('#version', () => {
    it('Retrieves the `version` property from the global store')
  })


})


