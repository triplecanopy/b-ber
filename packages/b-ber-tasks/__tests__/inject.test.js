import File from 'vinyl'
import { getFileObjects } from '../src/inject'

const mockFsReaddir = jest.fn().mockResolvedValue([])

jest.mock('fs-extra', () => ({
  readdir: (...args) => mockFsReaddir(...args),
  readFileSync: jest.fn().mockReturnValue(''),
  writeFile: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  config: { private: false },
  build: 'epub',
  dist: {
    ops: (...parts) => `/builds/epub/ops/${parts.join('/')}`,
    text: (file) => `/builds/epub/ops/text/${file}`,
  },
}))

jest.mock('@canopycanopycanopy/b-ber-logger')

beforeEach(() => {
  mockFsReaddir.mockClear()
})

describe('task: inject — getFileObjects', () => {
  test('returns one entry per input file', async () => {
    const files = [
      {
        name: 'chapter-01.xhtml',
        data: new File({ contents: Buffer.from('<p>hello</p>') }),
      },
      {
        name: 'chapter-02.xhtml',
        data: new File({ contents: Buffer.from('<p>world</p>') }),
      },
    ]
    const result = await getFileObjects(files)
    expect(result).toHaveLength(2)
  })

  test('preserves fileName from input', async () => {
    const files = [
      {
        name: 'chapter-01.xhtml',
        data: new File({ contents: Buffer.from('<p>test</p>') }),
      },
    ]
    const [{ fileName }] = await getFileObjects(files)
    expect(fileName).toBe('chapter-01.xhtml')
  })

  test('includes the file body content in output', async () => {
    const bodyContent = '<p>chapter content</p>'
    const files = [
      {
        name: 'test.xhtml',
        data: new File({ contents: Buffer.from(bodyContent) }),
      },
    ]
    const [{ contents }] = await getFileObjects(files)
    expect(contents).toContain(bodyContent)
  })

  test('injects bber env variable into output', async () => {
    const files = [
      {
        name: 'test.xhtml',
        data: new File({ contents: Buffer.from('<p>test</p>') }),
      },
    ]
    const [{ contents }] = await getFileObjects(files)
    expect(contents).toContain("window.bber.env = 'epub'")
  })

  test('reads stylesheet and javascript directories', async () => {
    const files = [
      { name: 'test.xhtml', data: new File({ contents: Buffer.from('') }) },
    ]
    await getFileObjects(files)
    const calledWith = mockFsReaddir.mock.calls.map(([p]) => p)
    expect(calledWith.some((p) => p.includes('stylesheets'))).toBe(true)
    expect(calledWith.some((p) => p.includes('javascripts'))).toBe(true)
  })

  test('returns empty array for empty input', async () => {
    const result = await getFileObjects([])
    expect(result).toEqual([])
  })

  test('accepts optional basePath argument', async () => {
    const files = [
      {
        name: 'test.xhtml',
        data: new File({ contents: Buffer.from('<p>test</p>') }),
      },
    ]
    const result = await getFileObjects(files, 'text')
    expect(result).toHaveLength(1)
    expect(result[0].fileName).toBe('test.xhtml')
  })
})
