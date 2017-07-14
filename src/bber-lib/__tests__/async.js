'use strict'

// npm run -s mocha:single -- ./src/bber-lib/__tests__/async.js

/* eslint-disable no-unused-expressions */

const chai = require('chai')
const sinon = require('sinon')
const chaiAsPromised = require('chai-as-promised') // eslint-disable-line no-unused-vars
const sinonChai = require('sinon-chai')
const serialize = require('../async').serialize

chai.should()
chai.use(chaiAsPromised)
chai.use(sinonChai)

const logger = require('../../__tests__/helpers/console')

describe('module:async', () => {
  let res
  let fns
  let spy1
  let spy2
  let seq

  describe('#serialize', () => {
    beforeEach(() => {
      logger.reset()
      res = []
      fns = {
        fn1: (() => res.push('foo')),
        fn2: (() => res.push('bar')),
      }
      spy1 = sinon.spy(fns, 'fn1')
      spy2 = sinon.spy(fns, 'fn2')

      seq = [fns.fn1, fns.fn2]
    })

    it('Should run a sequence of functions in the proper order', () =>
      serialize(seq).then(() => {
        spy1.should.have.been.calledBefore(spy2)
        spy2.should.have.been.calledOnce
        res.should.contain.all('foo', 'bar')
      })
    )

    // it('Should log messages to the console', () =>
    //   serialize(seq).then(() => {
    //     logger.infos.should.have.length(3)
    //     logger.infos[0].message.should.match(/Resolved fn1/)
    //     logger.infos[1].message.should.match(/Resolved fn2/)
    //     logger.infos[2].message.should.match(/Finished/)
    //   })
    // )
  })
})
