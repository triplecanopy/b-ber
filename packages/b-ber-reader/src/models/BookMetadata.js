class BookMetadata {
    constructor({ contributor, creator, format, identifier, language, publisher, rights, title }) {
        this.contributor = contributor
        this.creator = creator
        this.format = format
        this.identifier = identifier
        this.language = language
        this.publisher = publisher
        this.rights = rights
        this.title = title
    }
    set(key, val) {
        this[key] = val
    }
    get(key) {
        return this[key]
    }
}

export default BookMetadata
