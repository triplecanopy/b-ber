import { render } from '@testing-library/react'
import React from 'react'
import SpreadFigure from '../../src/components/SpreadFigure'
import ReaderApiContext from '../../src/lib/reader-api-context'
import ReaderContext from '../../src/lib/reader-context'
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

  // Regression: getTranslateX lives on the stable ReaderApiContext (which never
  // re-renders), so the figure must subscribe to the reactive spreadIndex from
  // ReaderContext to re-center on a page turn. Before the fix it kept the
  // mount-time margin and stayed stuck mid-screen.
  test('recomputes marginLeft when the reactive spreadIndex changes', () => {
    // Spread-aware translate: page N sits at N * 100. The figure is at left 100,
    // so it is centered (marginLeft 0) only when the reader is on spread 1.
    const getTranslateX = (idx) => idx * 100 * -1
    const apiValue = {
      getTranslateX,
      navigateToChapterByURL: () => {},
      getSpineItemByAbsoluteUrl: () => -1,
    }

    const renderAt = (spreadIndex) => (
      <ReaderApiContext.Provider value={apiValue}>
        <ReaderContext.Provider value={{ lastSpread: false, spreadIndex }}>
          <SpreadContext.Provider value={{ left: 100, layout: 'columns' }}>
            <SpreadFigure id="fig-1" className="bber-figure">
              <img alt="" src="x.png" />
            </SpreadFigure>
          </SpreadContext.Provider>
        </ReaderContext.Provider>
      </ReaderApiContext.Provider>
    )

    const { container, rerender } = render(renderAt(0))
    const offset = window.innerWidth / 2

    // On spread 0 the figure is off to the right (pushed in from the left edge).
    expect(container.querySelector('figure#fig-1').style.marginLeft).toBe(
      `${offset}px`
    )

    // Page forward to spread 1: figure must re-center.
    rerender(renderAt(1))
    expect(container.querySelector('figure#fig-1').style.marginLeft).toBe('0px')
  })
})
