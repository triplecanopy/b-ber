/* eslint-disable react/require-default-props,react/no-unused-prop-types */

import React, { Component } from 'react'
import {
  __cssHeightDeclarationPropType,
  cssHeightDeclarationPropType,
} from '../../src/lib/custom-prop-types'

test('validates a custom propType', done => {
  expect(__cssHeightDeclarationPropType({ height: 10 }, 'height')).toBe(null)
  expect(__cssHeightDeclarationPropType({ height: 10 }, 'random')).toBe(null)
  expect(__cssHeightDeclarationPropType({ height: 'auto' }, 'height')).toBe(
    null
  )
  expect(__cssHeightDeclarationPropType({ height: null }, 'height')).toBe(null)

  expect(
    __cssHeightDeclarationPropType({ height: 'foo' }, 'height')
  ).toBeInstanceOf(Error)
  expect(
    __cssHeightDeclarationPropType({ height: '10' }, 'height')
  ).toBeInstanceOf(Error)
  expect(
    __cssHeightDeclarationPropType({ height: '' }, 'height')
  ).toBeInstanceOf(Error)

  done()
})

test('creates a chainable propType', done => {
  const spy = jest.spyOn(console, 'error')
  console.error.mockImplementation(() => {})

  class Foo extends Component {}

  Foo.propTypes = { height: __cssHeightDeclarationPropType.isRequired }
  React.createElement(Foo, {}, null)
  expect(spy)
    .toHaveBeenCalledWith(`Warning: Failed prop type: Foo: prop type \`height\` is invalid; it must be a function, usually from the \`prop-types\` package, but received \`undefined\`.
    in Foo`)

  Foo.propTypes = { height: cssHeightDeclarationPropType.isRequired }
  React.createElement(Foo, {}, null)

  expect(spy)
    .toHaveBeenCalledWith(`Warning: Failed prop type: Required undefined height was not specified in Foo
    in Foo`)

  Foo.propTypes = { height: cssHeightDeclarationPropType.isRequired }
  React.createElement(Foo, { height: 0 }, null)

  expect(spy).toHaveBeenCalledTimes(2)

  console.error.mockRestore()

  done()
})
