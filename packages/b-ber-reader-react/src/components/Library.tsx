import React from 'react'

// The component reads `name` and `cover`; callers may pass additional fields
// (e.g. `title`, `url`) that are forwarded untouched to handleClick.
interface LibraryBook {
  name?: string
  cover?: string
  [key: string]: unknown
}

interface LibraryProps {
  books: LibraryBook[]
  handleClick: (book: LibraryBook) => void
}

const Library = (props: LibraryProps) => (
  <div>
    {props.books.map((book, i) => (
      <button
        key={i}
        onClick={() => props.handleClick(book)}
        style={{
          width: 200,
          height: 300,
          display: 'inline-block',
          backgroundImage: `url(${book.cover})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        {book.name}
      </button>
    ))}
  </div>
)

export default Library
