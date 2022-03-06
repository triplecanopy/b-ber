class BookMetadata {
  constructor({
    title,
    creator,
    date,
    publisher,
    description,
    language,
    rights,
    identifier,
  }) {
    this.title = title
    this.creator = creator
    this.date = date
    this.publisher = publisher
    this.description = description
    this.language = language
    this.rights = rights
    this.identifier = identifier
  }

  set(key, val) {
    this[key] = val
  }

  get(key) {
    return this[key]
  }
}

export default BookMetadata
