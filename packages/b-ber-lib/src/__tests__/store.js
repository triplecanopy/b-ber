/* eslint-disable no-unused-expressions */

'use strict'

// npm run -s mocha:single -- ./src/bber-lib/__tests__/state.js

require('chai').should() // eslint-disable-line import/no-extraneous-dependencies
const state = require('../state').default

describe('Store', () => {
    beforeEach(() => state.reset())

    describe('#_checkTypes', () => {
        it('Should ensure that input parameters are valid', () =>
            (() => state.add('foo', 'bar')).should.throw(TypeError)
        )
    })
    describe('#add', () => {
        it('Should add an item to an array or object', () => {
            const a = 'foo'
            const o = {foo: 1}
            state.add('pages', a)
            state.add('cursor', o)
            state.pages.should.have.length(1)
            state.cursor.should.have.length(1)
            state.cursor[0].should.have.property('foo')
        })
    })
    describe('#remove', () => {
        before(() => state.add('pages', 'foo'))
        it('Should remove an item from an array or object', () => {
            state.remove('pages', 'foo')
            state.pages.should.be.empty
        })
    })
    describe('#merge', () => {
        it('Should merge two objects', () => {
            state.merge('builds', {foo: 1})
            state.merge('builds', {bar: 2})
            state.builds.should.include({foo: 1, bar: 2})
        })
    })
    describe('#update', () => {
        before(() => state.add('pages', 'foo'))
        it('Should set the value of a property', () => {
            state.update('pages', ['bar'])
            state.pages.should.have.length(1)
            state.pages.should.contain('bar')
        })
    })
})
