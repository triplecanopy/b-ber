import axios from 'axios'

class Request {
  static get(url) {
    return axios.get(url)
  }
  static getManifest() {
    return Request.get('/api/books.json')
  }
}

export default Request
