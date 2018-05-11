
import Toc from '../src/Toc'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
    templates: {
        dynamicPageHead: () => {},
        dynamicPageTail: () => {},
    },
}))

describe('templates.Toc', () => {

    it('creates an anchor element', () => {
        const node = {in_toc: true, relativePath: 'test', title: 'Test'}
        expect(Toc.item(node)).toMatchSnapshot()
    })

    it('creates an xhtml document', () => {
        expect(Toc.document().contents).toMatchSnapshot()
        expect(Toc.document().history).toMatchSnapshot()
    })

    it('creates a nested list', () => {
        const node = {in_toc: true, relativePath: 'test', title: 'Test'}
        const nodes = [{in_toc: true, relativePath: 'test-child', title: 'Test Child'}]
        const data = [{
            in_toc: false,
        }, {
            ...node,
            nodes,
        }]
        expect(Toc.items(data)).toMatchSnapshot()
    })

})
