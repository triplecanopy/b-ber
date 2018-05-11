import Xml from '../src/Xml'

describe('templates.Xml', () => {
    test('container matches the snapshot', () => {
        expect(Xml.container()).toMatchSnapshot()
    })

    test('mimetype matches the snapshot', () => {
        expect(Xml.mimetype()).toMatchSnapshot()
    })
})
