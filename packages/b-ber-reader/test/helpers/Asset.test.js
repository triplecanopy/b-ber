/* global test,expect */

import Asset from '../../src/helpers/Asset'

test('creates a hash', () => {
    expect(Asset.createHash('foo')).toBe('101574')
    expect(Asset.createHash('')).toMatch('0')
    expect(Asset.createHash()).toMatch(/^-?\d{10}$/)
})

test('creates a random id', () => {
    expect(Asset.createId()).toMatch(/^_\w{9}$/)
})

test('creates escaped React attributes', () => {
    expect(
        Asset.convertToReactAttrs({
            'data-foo': 'bar',
            style: 'font-family: times',
        }),
    ).toEqual({ 'data-foo': 'bar', style: { fontFamily: 'times' } })

    expect(
        Asset.convertToReactAttrs({ style: 'height: 10px; border: 0' }),
    ).toEqual({ style: { height: '10px', border: '0' } })

    expect(
        Asset.convertToReactAttrs({
            style:
                '-webkit-overflow-scrolling: touch; -ms-user-select: none; -moz-transition-delay: 1s; -o-perspective: 100px;',
        }),
    ).toEqual({
        style: {
            WebkitOverflowScrolling: 'touch',
            msUserSelect: 'none',
            MozTransitionDelay: '1s',
            OPerspective: '100px',
        },
    })
})

test('appends a stylsheet', () => {
    Object.defineProperty(window.URL, 'createObjectURL', { value: () => {} }) // https://github.com/jsdom/jsdom/issues/1721
    Asset.appendBookStyles('', 'test')
    expect(document.querySelector('#_test')).not.toBe(null)
})

test('removes a stylsheet', () => {
    const link = document.createElement('link')
    link.id = 'test'
    document.head.appendChild(link)
    expect(document.querySelector('#_test')).not.toBe(null)

    Asset.removeBookStyles('test')
    expect(document.querySelector('#_test')).toBe(null)
    expect(() => Asset.removeBookStyles('test')).not.toThrow()
})
