export interface BookMetadataProps {
  title: string
  creator: string
  date: string
  publisher: string
  description: string
  language: string
  rights: string
  identifier: string
}

class BookMetadata implements BookMetadataProps {
  title: string
  creator: string
  date: string
  publisher: string
  description: string
  language: string
  rights: string
  identifier: string

  constructor({
    title,
    creator,
    date,
    publisher,
    description,
    language,
    rights,
    identifier,
  }: BookMetadataProps) {
    this.title = title
    this.creator = creator
    this.date = date
    this.publisher = publisher
    this.description = description
    this.language = language
    this.rights = rights
    this.identifier = identifier
  }

  set<K extends keyof this>(key: K, val: this[K]): void {
    this[key] = val
  }

  get<K extends keyof this>(key: K): this[K] {
    return this[key]
  }
}

export default BookMetadata
