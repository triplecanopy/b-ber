import fs from 'fs-extra'
import File from 'vinyl'
import Template from '../src/Template'

jest.mock('../src/Spine')
jest.mock('../src/SpineItem')

beforeAll(() => fs.mkdirp('_project/_media'))
afterAll(() => Promise.all([fs.remove('_project'), fs.remove('themes')]))

describe('Template.render', () => {
  it('renders content into a vinyl layout using {% body %} as placeholder', () => {
    const layout = new File({
      path: 'wrapper.html',
      contents: Buffer.from('<wrapper>{% body %}</wrapper>'),
    })
    const result = Template.render('<p>hello</p>', layout)
    expect(result).toContain('<p>hello</p>')
    expect(result).toContain('<wrapper>')
  })
})
