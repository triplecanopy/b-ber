/* eslint-disable no-unused-expressions */

'use strict'

// npm run -s mocha:single -- ./src/bber-lib/__tests__/store.js

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
            const a = 'foo'
            const o = { foo: 1 }
            store.add('pages', a)
            store.add('cursor', o)
            store.pages.should.have.length(1)
            store.cursor.should.have.length(1)
            store.cursor[0].should.have.property('foo')
        })
    })
    describe('#remove', () => {
        before(() => store.add('pages', 'foo'))
        it('Should remove an item from an array or object', () => {
            store.remove('pages', 'foo')
            store.pages.should.be.empty
        })
    })
    describe('#merge', () => {
        it('Should merge two objects', () => {
            store.merge('builds', { foo: 1 })
            store.merge('builds', { bar: 2 })
            store.builds.should.include({ foo: 1, bar: 2 })
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
