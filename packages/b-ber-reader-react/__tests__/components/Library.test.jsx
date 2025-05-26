/* eslint-disable react/jsx-props-no-spreading */
/* global jsdom */
/* eslint-disable prefer-destructuring */

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import Library from '../../src/components/Library'
import history from '../../src/lib/History'

describe('Library', () => {
  test('renders the component', () => {
    jsdom.reconfigure({ url: 'http://localhost:3000/' })

    const props = {
      books: [{ title: 'Book 1', cover: 'cover-1.jpg' }],
      handleClick: ({ title, url }) => history.push(title, { bookURL: url }),
    }

    const component = render(<Library {...props} />)
    const { container } = component

    expect(container).toMatchSnapshot()

    const button = container.querySelector('button')
    expect(button.style.backgroundImage).toMatch(/^url\(cover-1.jpg\)/)

    fireEvent.click(button)
    expect(window.location.href).toBe('http://localhost:3000/Book%201')
  })
})
