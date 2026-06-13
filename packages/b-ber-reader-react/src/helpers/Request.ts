import Url from './Url'

interface RequestResult {
  // Response body — JSON parses to arbitrary shapes, text to string.
  // TODO: type this per call site.
  data: any
  request: { ok: boolean; status: number; url: string }
}

class Request {
  static async get(
    requestUrl: string,
    type: 'json' | 'text'
  ): Promise<RequestResult> {
    const resp = await fetch(requestUrl)
    const { ok, status, url } = resp

    const data = await resp[type]()

    return { data, request: { ok, status, url } }
  }

  static async getJson(requestUrl: string): Promise<RequestResult> {
    return Request.get(requestUrl, 'json')
  }

  static async getText(requestUrl: string): Promise<RequestResult> {
    return Request.get(requestUrl, 'text')
  }

  static getBooks(basePath = ''): Promise<RequestResult> {
    const url = `${Url.stripTrailingSlash(basePath)}/api/books.json`
    return Request.getJson(url)
  }
}

export default Request
