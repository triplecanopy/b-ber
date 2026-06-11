/* eslint-disable react/require-default-props,react/no-unused-prop-types */

import React, { Component } from 'react'
import {
  __cssHeightDeclarationPropType,
  cssHeightDeclarationPropType,
} from '../../src/lib/custom-prop-types'

test('validates a custom propType', (done) => {
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

test('chainable propType returns null when prop is absent and not required', () => {
  expect(cssHeightDeclarationPropType({}, 'height', 'Foo', 'prop')).toBe(null)
})

test('chainable propType.isRequired returns an Error when prop is absent', () => {
  const result = cssHeightDeclarationPropType.isRequired(
    {},
    'height',
    'Foo',
    'prop'
  )

  expect(result).toBeInstanceOf(Error)
  expect(result.message).toBe(
    'Required undefined height was not specified in Foo'
  )
})

test('chainable propType delegates to the validator when prop is present', () => {
  expect(
    cssHeightDeclarationPropType({ height: 10 }, 'height', 'Foo', 'prop')
  ).toBe(null)

  expect(
    cssHeightDeclarationPropType.isRequired(
      { height: 'foo' },
      'height',
      'Foo',
      'prop'
    )
  ).toBeInstanceOf(Error)
})

test.skip('creates a chainable propType', (done) => {
  const spy = jest.spyOn(console, 'error')
  console.error.mockImplementation(() => {})

  class Foo extends Component {}

  Foo.propTypes = { height: __cssHeightDeclarationPropType.isRequired }
  React.createElement(Foo, {}, null)
  expect(spy).toHaveBeenCalledWith(
    `Warning: Failed prop type: Foo: prop type \`height\` is invalid; it must be a function, usually from the \`prop-types\` package, but received \`undefined\`.This often happens because of typos such as \`PropTypes.function\` instead of \`PropTypes.func\`.
    in Foo`
  )

  Foo.propTypes = { height: cssHeightDeclarationPropType.isRequired }
  React.createElement(Foo, {}, null)

  expect(
    spy
  ).toHaveBeenCalledWith(`Warning: Failed prop type: Required undefined height was not specified in Foo
    in Foo`)

  Foo.propTypes = { height: cssHeightDeclarationPropType.isRequired }
  React.createElement(Foo, { height: 0 }, null)

  expect(spy).toHaveBeenCalledTimes(2)

  console.error.mockRestore()

  done()
})
