import { render } from '@testing-library/react'
import React from 'react'
import SpreadFigure from '../../src/components/SpreadFigure'
import ReaderApiContext from '../../src/lib/reader-api-context'
import SpreadContext from '../../src/lib/spread-context'

const renderSpreadFigure = ({ getTranslateX, left, ...props } = {}) => {
  const readerApiValue = {
    getTranslateX,
    navigateToChapterByURL: () => {},
    getSpineItemByAbsoluteUrl: () => -1,
  }

  return render(
    <ReaderApiContext.Provider value={readerApiValue}>
      <SpreadContext.Provider value={{ left, layout: 'columns' }}>
        <SpreadFigure id="fig-1" className="bber-figure" {...props}>
          <img alt="" src="x.png" />
        </SpreadFigure>
      </SpreadContext.Provider>
    </ReaderApiContext.Provider>
  )
}

describe('SpreadFigure', () => {
  test('marginLeft is 0 when absTranslateX equals the floored left value', () => {
    const { container } = renderSpreadFigure({
      getTranslateX: () => -5,
      left: 5,
    })

    const figure = container.querySelector('figure#fig-1')
    expect(figure.style.left).toBe('5px')
    expect(figure.style.marginLeft).toBe('0px')
  })

  test('marginLeft is negative half window width when absTranslateX > left', () => {
    const { container } = renderSpreadFigure({
      getTranslateX: () => -10,
      left: 5,
    })

    const figure = container.querySelector('figure#fig-1')
    const offset = window.innerWidth / 2

    expect(figure.style.marginLeft).toBe(`${offset * -1}px`)
  })

  test('marginLeft is positive half window width when absTranslateX < left', () => {
    const { container } = renderSpreadFigure({
      getTranslateX: () => -1,
      left: 5,
    })

    const figure = container.querySelector('figure#fig-1')
    const offset = window.innerWidth / 2

    expect(figure.style.marginLeft).toBe(`${offset}px`)
  })

  test('floors fractional left values and falls back to empty className', () => {
    const { container } = renderSpreadFigure({
      getTranslateX: () => -5,
      left: 5.9,
      className: undefined,
    })

    const figure = container.querySelector('figure#fig-1')
    expect(figure.style.left).toBe('5px')
    expect(figure.className).toBe('')
  })

  test('renders children', () => {
    const { container } = renderSpreadFigure({
      getTranslateX: () => 0,
      left: 0,
    })

    expect(container.querySelector('img')).not.toBeNull()
  })
})
