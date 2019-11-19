/* global jest,test,expect,jsdom */
/* eslint-disable prefer-destructuring */

import React from 'react'
import renderer from 'react-test-renderer'
import Library from '../../src/components/Library'
import history from '../../src/lib/History'

describe('Library', () => {
  test('renders the component', () => {
    jsdom.reconfigure({ url: 'http://localhost:3000/' })

    const props = {
      books: [{ title: 'Book 1', cover: 'cover-1.jpg' }],
      handleClick: ({ title, url }) => history.push(title, { bookURL: url }),
    }

    const component = renderer.create(<Library {...props} />)
    const root = component.root

    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()

    const button = root.findByType('button')
    expect(button.props.style.backgroundImage).toMatch(/^url\(cover-1.jpg\)/)

    button.props.onClick()
    expect(window.location.href).toBe('http://localhost:3000/Book%201')
  })
})
