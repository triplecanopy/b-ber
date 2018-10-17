/* global jest,test,expect */

import BookMetadata from '../../src/models/BookMetadata'

test('creates a metadata item', () => {
    const data = {
        contributor: 'a',
        creator: 'b',
        format: 'c',
        identifier: 'd',
        language: 'e',
        publisher: 'f',
        rights: 'g',
        title: 'h',
    }
    const bookMetadata = new BookMetadata(data)

    expect(bookMetadata).toEqual(
        expect.objectContaining({
            contributor: expect.any(String),
            creator: expect.any(String),
            format: expect.any(String),
            identifier: expect.any(String),
            language: expect.any(String),
            publisher: expect.any(String),
            rights: expect.any(String),
            title: expect.any(String),
        }),
    )

    expect(bookMetadata.contributor).toBe('a')

    bookMetadata.set('contributor', 'x')
    expect(bookMetadata.get('contributor')).toBe('x')
})
