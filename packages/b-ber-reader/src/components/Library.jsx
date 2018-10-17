import React from 'react'

const Library = props => (
    <div>
        {props.books.map((book, i) => (
            <button
                key={i}
                onClick={_ => props.handleClick(book)}
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
