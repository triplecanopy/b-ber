import Url from './Url'

class Request {
  static async get(requestUrl, type) {
    const resp = await fetch(requestUrl)
    const { ok, status, url } = resp

    const data = await resp[type]()

    return { data, request: { ok, status, url } }
  }

  static async getJson(requestUrl) {
    return Request.get(requestUrl, 'json')
  }

  static async getText(requestUrl) {
    return Request.get(requestUrl, 'text')
  }

  static getBooks(basePath = '') {
    const url = `${Url.stripTrailingSlash(basePath)}/api/books.json`
    return Request.getJson(url)
  }
}

export default Request
