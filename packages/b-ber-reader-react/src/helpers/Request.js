import axios from 'axios'
import Url from './Url'

class Request {
  static get(url) {
    return axios.get(url)
  }

  static getBooks(basePath = '') {
    const url = `${Url.stripTrailingSlash(basePath)}/api/books.json`
    return Request.get(url)
  }
}

export default Request
