import fs from 'fs-extra'
import Toc from '../src/Toc'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({}))

afterAll(() => fs.remove('_project'))

describe('templates.Toc', () => {
    it('creates an anchor element', () => {
        const node = { in_toc: true, relativePath: 'test', title: 'Test' }
        expect(Toc.item(node)).toMatchSnapshot()
    })

    it('creates an ordered list', () => {
        const node = {
            in_toc: true,
            relativePath: 'l1',
            title: 'Test',
            nodes: [
                {
                    in_toc: true,
                    relativePath: 'l2',
                    title: 'Test',
                    nodes: [{ in_toc: true, relativePath: 'l3', title: 'Test', nodes: [] }],
                },
            ],
        }
        expect(Toc.item(node)).toMatchSnapshot()
    })

    it('creates a nav element', () => {
        expect(Toc.body().contents).toMatchSnapshot()
    })

    it('creates a nested list', () => {
        const node = { in_toc: true, relativePath: 'test', title: 'Test' }
        const nodes = [{ in_toc: true, relativePath: 'test-child', title: 'Test Child' }]
        const data = [
            {
                in_toc: false,
            },
            {
                ...node,
                nodes,
            },
        ]
        expect(Toc.items(data)).toMatchSnapshot()
    })
})
