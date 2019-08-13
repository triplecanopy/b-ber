/* global jest,test,expect */

import GuideItem from '../../src/models/GuideItem'

describe('GuideItem', () => {
    test('creates a guide item', () => {
        const data = { type: 'a', title: 'b', href: 'c' }
        const guideItem = new GuideItem(data)
        expect(guideItem).toEqual(
            expect.objectContaining({
                type: expect.any(String),
                title: expect.any(String),
                href: expect.any(String),
                absoluteURL: expect.any(String),
            })
        )
    })
})
