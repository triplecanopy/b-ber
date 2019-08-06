/* global jest,test,expect */

import BookMetadata from '../../src/models/BookMetadata'

describe('BookMetaData', () => {
    test('creates a metadata item', () => {
        const data = {
            title: 'a',
            creator: 'b',
            date: 'c',
            publisher: 'd',
            description: 'e',
            language: 'f',
            rights: 'g',
            identifier: 'h',
        }
        const bookMetadata = new BookMetadata(data)

        expect(bookMetadata).toEqual(
            expect.objectContaining({
                title: expect.any(String),
                creator: expect.any(String),
                date: expect.any(String),
                publisher: expect.any(String),
                description: expect.any(String),
                language: expect.any(String),
                rights: expect.any(String),
                identifier: expect.any(String),
            })
        )

        expect(bookMetadata.creator).toBe('b')

        bookMetadata.set('creator', 'x')
        expect(bookMetadata.get('creator')).toBe('x')
    })
})
