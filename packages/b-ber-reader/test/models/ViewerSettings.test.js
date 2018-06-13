/* global jest,test,expect */

import ViewerSettings from '../../src/models/ViewerSettings'
import {transitions, themes} from '../../src/constants'

console.error = jest.fn()

describe('ViewerSettings', () => {
    test('creates the viewer settings', () => {

        let vs

        vs = new ViewerSettings({})

        expect(vs.settings).toEqual(expect.objectContaining({
            paddingTop: expect.any(Number),
            paddingLeft: expect.any(Number),
            paddingRight: expect.any(Number),
            paddingBottom: expect.any(Number),
            fontSize: expect.any(Number),
            columnGapPage: expect.any(Number),
            columnGapLayout: expect.any(Number),
            theme: themes.DEFAULT,
            transition: transitions.SLIDE,
            transitionSpeed: expect.any(Number),
        }))

        vs = new ViewerSettings({paddingTop: 1})

        expect(vs.settings).toEqual(expect.objectContaining({
            paddingTop: 1,
        }))
    })

    test('gets properties using lenses', () => {

        const vs = new ViewerSettings({})

        expect(vs.paddingTop).toEqual(ViewerSettings.defaults.paddingTop)
        expect(vs.paddingLeft).toEqual(ViewerSettings.defaults.paddingLeft)
        expect(vs.paddingRight).toEqual(ViewerSettings.defaults.paddingRight)
        expect(vs.paddingBottom).toEqual(ViewerSettings.defaults.paddingBottom)
        expect(vs.paddingX).toEqual(ViewerSettings.defaults.paddingLeft + ViewerSettings.defaults.paddingRight)
        expect(vs.paddingY).toEqual(ViewerSettings.defaults.paddingTop + ViewerSettings.defaults.paddingBottom)
        expect(vs.columns).toEqual(ViewerSettings.defaults.columns)
        expect(vs.columnGapPage).toEqual(ViewerSettings.defaults.columnGapPage)
        expect(vs.columnGapLayout).toEqual(ViewerSettings.defaults.columnGapLayout)
        expect(vs.transition).toEqual(ViewerSettings.defaults.transition)
        expect(vs.transitionSpeed).toEqual(ViewerSettings.defaults.transitionSpeed)
        expect(vs.theme).toEqual(ViewerSettings.defaults.theme)
    })

    test('sets properties using lenses', () => {

        const vs = new ViewerSettings({})

        vs.paddingTop = 1
        vs.paddingLeft = 1
        vs.paddingRight = 1
        vs.paddingBottom = 1
        vs.columns = 1
        vs.columnGapPage = 1
        vs.columnGapLayout = 1
        vs.transition = 1
        vs.transitionSpeed = 1
        vs.theme = 1

        expect(vs.paddingTop).toBe(1)
        expect(vs.paddingLeft).toBe(1)
        expect(vs.paddingRight).toBe(1)
        expect(vs.paddingBottom).toBe(1)
        expect(vs.columns).toBe(1)
        expect(vs.columnGapPage).toBe(1)
        expect(vs.columnGapLayout).toBe(1)
        expect(vs.transition).toBe(1)
        expect(vs.transitionSpeed).toBe(1)
        expect(vs.theme).toBe(1)

        expect(() => vs.paddingX = 1).toThrow()
        expect(() => vs.paddingY = 1).toThrow()
    })

    it('sets properties using shorthand values', () => {

        const vs = new ViewerSettings({})

        vs.padding = [1, 2, 3, 4]

        expect(vs.paddingTop).toBe(1)
        expect(vs.paddingRight).toBe(2)
        expect(vs.paddingBottom).toBe(3)
        expect(vs.paddingLeft).toBe(4)

    })

    it('uses custom lenses', () => {

        const vs = new ViewerSettings({})

        expect(typeof vs.fontSize).toBe('string')

        vs.fontSize = 100
        expect(vs.fontSize).toBe('100%')

        vs.fontSize = '100'
        expect(vs.fontSize).toBe('100%')

        vs.fontSize = null
        expect(typeof vs.fontSize).toBe('string')
        expect(vs.fontSize).toMatch(/%$/)

    })

    it('gets properties by key', () => {

        const vs = new ViewerSettings({})

        expect(vs.get('paddingTop')).toBe(ViewerSettings.defaults.paddingTop)
        expect(vs.get('paddingLeft')).toBe(ViewerSettings.defaults.paddingLeft)
        expect(vs.get('paddingRight')).toBe(ViewerSettings.defaults.paddingRight)
        expect(vs.get('paddingBottom')).toBe(ViewerSettings.defaults.paddingBottom)
        expect(vs.get('columns')).toBe(ViewerSettings.defaults.columns)
        expect(vs.get('columnGapPage')).toBe(ViewerSettings.defaults.columnGapPage)
        expect(vs.get('columnGapLayout')).toBe(ViewerSettings.defaults.columnGapLayout)
        expect(vs.get('transition')).toBe(ViewerSettings.defaults.transition)
        expect(vs.get('transitionSpeed')).toBe(ViewerSettings.defaults.transitionSpeed)
        expect(vs.get('theme')).toBe(ViewerSettings.defaults.theme)

        expect(vs.get()).toEqual(ViewerSettings.defaults)
    })

    it('sets properties by key', () => {

        const vs = new ViewerSettings({})

        vs.put('paddingTop', 1)
        vs.put('paddingLeft', 1)
        vs.put('paddingRight', 1)
        vs.put('paddingBottom', 1)
        vs.put('columns', 1)
        vs.put('columnGapPage', 1)
        vs.put('columnGapLayout', 1)
        vs.put('transition', 1)
        vs.put('transitionSpeed', 1)
        vs.put('theme', 1)

        expect(vs.paddingTop).toBe(1)
        expect(vs.paddingLeft).toBe(1)
        expect(vs.paddingRight).toBe(1)
        expect(vs.paddingBottom).toBe(1)
        expect(vs.columns).toBe(1)
        expect(vs.columnGapPage).toBe(1)
        expect(vs.columnGapLayout).toBe(1)
        expect(vs.transition).toBe(1)
        expect(vs.transitionSpeed).toBe(1)
        expect(vs.theme).toBe(1)

        vs.put('fontSize', 1.1)
        expect(vs.fontSize).toBe('1.1%')

        vs.put('fontSize', '100.0')
        expect(vs.fontSize).toBe('100.0%')

        vs.put({fontSize: '100', paddingBottom: 1})
        expect(vs.fontSize).toBe('100%')
        expect(vs.paddingBottom).toBe(1)

        vs.put(['bogus'])
        expect(console.error).toHaveBeenCalled()

    })

})
