/* global test,expect */

import Asset from '../../src/helpers/Asset'

test('creates a hash', done => {
    expect(Asset.createHash('foo')).toBe(101574)
    done()
})


test('creates escaped React attributes', done => {
    expect(Asset.convertToReactAttrs(
        {'data-foo': 'bar', style: 'font-family: times'}
    )).toEqual({'data-foo': 'bar', style: {fontFamily: 'times'}})

    expect(Asset.convertToReactAttrs(
        {style: 'height: 10px; border: 0'}
    )).toEqual({style: {height: '10px', border: '0'}})

    expect(Asset.convertToReactAttrs(
        {style: '-webkit-overflow-scrolling: touch; -ms-user-select: none; -moz-transition-delay: 1s; -o-perspective: 100px;'}
    )).toEqual({style: {
        WebkitOverflowScrolling: 'touch',
        msUserSelect: 'none',
        MozTransitionDelay: '1s',
        OPerspective: '100px',
    }})

    done()
})
