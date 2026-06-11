import Request from '../../src/helpers/Request'
import Url from '../../src/helpers/Url'

describe('Request', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    delete global.fetch
  })

  test('getJson returns parsed json data along with response info', async () => {
    const jsonData = { foo: 'bar' }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      url: 'http://example.com/foo.json',
      json: jest.fn().mockResolvedValue(jsonData),
    })

    const result = await Request.getJson('http://example.com/foo.json')

    expect(global.fetch).toHaveBeenCalledWith('http://example.com/foo.json')
    expect(result).toEqual({
      data: jsonData,
      request: { ok: true, status: 200, url: 'http://example.com/foo.json' },
    })
  })

  test('getText returns text data along with response info', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      url: 'http://example.com/foo.txt',
      text: jest.fn().mockResolvedValue('hello world'),
    })

    const result = await Request.getText('http://example.com/foo.txt')

    expect(global.fetch).toHaveBeenCalledWith('http://example.com/foo.txt')
    expect(result).toEqual({
      data: 'hello world',
      request: { ok: true, status: 200, url: 'http://example.com/foo.txt' },
    })
  })

  test('getBooks constructs the books.json url and fetches it', async () => {
    const jsonData = { books: [] }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      url: 'http://example.com/api/books.json',
      json: jest.fn().mockResolvedValue(jsonData),
    })

    const result = await Request.getBooks('http://example.com/')

    expect(global.fetch).toHaveBeenCalledWith(
      `${Url.stripTrailingSlash('http://example.com/')}/api/books.json`
    )
    expect(result.data).toEqual(jsonData)
  })

  test('getBooks defaults to an empty base path', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      url: '/api/books.json',
      json: jest.fn().mockResolvedValue({}),
    })

    await Request.getBooks()

    expect(global.fetch).toHaveBeenCalledWith('/api/books.json')
  })
})
