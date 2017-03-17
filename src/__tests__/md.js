
/* eslint-disable import/no-extraneous-dependencies */

require('chai').should()

// MarkIt.render(fname, data), idx, len, rs, rj)
// const MarkdownIt = require('markdown-it')

const MarkIt = require('../tasks/md').default

describe('MarkIt', () => {
  describe('#constructor', () => {
    it('Creates a new instance of the MarkIt class', () => {
      MarkIt.should.be.an.instanceOf(Object)
    })
  })
})
