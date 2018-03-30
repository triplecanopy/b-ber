import axios from 'axios'

class Request {
    static get(url) {
        return axios.get(url)
    }
}

export default Request
