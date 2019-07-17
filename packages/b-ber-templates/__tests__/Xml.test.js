import fs from 'fs-extra'
import Xml from '../src/Xml'

afterAll(() => fs.remove('_project'))

describe('templates.Xml', () => {
    test('container matches the snapshot', () => {
        expect(Xml.container()).toMatchSnapshot()
    })

    test('mimetype matches the snapshot', () => {
        expect(Xml.mimetype()).toMatchSnapshot()
    })
})
