import crypto from 'crypto'

// Keep track of footnotes that have been rendered to start new ordered lists at
// proper count
class Counter {
  constructor() {
    this.page = -1
    this.list = 1
    this.item = 1
    this.refs = new Map()
  }

  listCounter(grouped, page) {
    // Reset all counters if the footnotes list is empty. This occurs when
    // running `bber serve`
    if (page === 0) {
      this.page = -1
      this.item = 1
      this.list = 1
    }

    if (!grouped) {
      return this.item
    }

    if (page !== this.page) {
      this.list = 1
    } else {
      this.list += 1
    }

    return this.list
  }

  listItemCounter(grouped, page) {
    if (!grouped) {
      const n = this.item
      this.item += 1
      return n
    }

    if (page !== this.page) {
      this.page = page
      this.item = 1
    } else {
      this.item += 1
    }

    return this.item
  }

  findOrCreateRef = id => {
    if (!this.refs.has(id)) {
      const hash = crypto.randomBytes(8).toString('hex')
      const idRef = `-${id}-${hash}`

      this.refs.set(id, idRef)
    }

    return this.refs.get(id)
  }
}

export default Counter
