/* eslint-disable */

import React, { Component } from 'react'
import Viewport from '../helpers/Viewport'
import { showGrid, showBreakpoints } from '../config'

const BreakpointTable = props => (
  <span style={{ display: 'table', float: 'left', paddingLeft: 15 }}>
    {props.children}
  </span>
)

const BreakpointRow = props => (
  <span style={{ display: 'table-row' }}>{props.children}</span>
)
const BreakpointColumn = props => (
  <React.Fragment>
    {typeof props.cond === 'undefined' ? (
      <span style={{ display: 'table-cell' }}>{props.children}</span>
    ) : (
      <span
        style={{
          display: 'table-cell',
          border: '1px solid',
          height: 20,
          width: 20,
          backgroundColor: props.cond ? 'red' : '',
        }}
      />
    )}
  </React.Fragment>
)

const VerticalGrid = () => {
  const gridColumns = Viewport.getColumnCount()
  const columnWidth = Viewport.getColumnWidth()
  const gutterWidth = Viewport.getGutterWidth()
  const paddingLeft = columnWidth + gutterWidth
  const lines = new Array(gridColumns).fill()

  return (
    <div className="grid__debug">
      {lines.map((_, i) => (
        <span
          key={i}
          style={{ left: paddingLeft * i, width: columnWidth }}
          className="grid__debug__line"
        >
          {i + 1}
        </span>
      ))}
    </div>
  )
}

class DebugGrid extends Component {
  render() {
    return (
      <React.Fragment>
        {showBreakpoints && (
          <React.Fragment>
            <div
              style={{
                position: 'fixed',
                top: 45,
                right: 10,
              }}
            >
              <BreakpointTable>
                <BreakpointRow>
                  <BreakpointColumn>&nbsp;</BreakpointColumn>
                  <BreakpointColumn>Breakpoint X:</BreakpointColumn>
                  <BreakpointColumn>
                    {Viewport.horizontalSmall() && 'SMALL'}
                    {Viewport.horizontalMedium() && 'MEDIUM'}
                    {Viewport.horizontalLarge() && 'LARGE'}
                  </BreakpointColumn>
                </BreakpointRow>
                <BreakpointRow>
                  <BreakpointColumn>&nbsp;</BreakpointColumn>
                  <BreakpointColumn>Breakpoint Y:</BreakpointColumn>
                  <BreakpointColumn>
                    {Viewport.verticalSmall() && 'SMALL'}
                    {Viewport.verticalMedium() && 'MEDIUM'}
                    {Viewport.verticalLarge() && 'LARGE'}
                  </BreakpointColumn>
                </BreakpointRow>
              </BreakpointTable>
              <BreakpointTable>
                <BreakpointRow>
                  <BreakpointColumn
                    cond={
                      Viewport.horizontalSmall() && Viewport.verticalSmall()
                    }
                  />
                  <BreakpointColumn
                    cond={
                      Viewport.horizontalMedium() && Viewport.verticalSmall()
                    }
                  />
                  <BreakpointColumn
                    cond={
                      Viewport.horizontalLarge() && Viewport.verticalSmall()
                    }
                  />
                </BreakpointRow>

                <BreakpointRow>
                  <BreakpointColumn
                    cond={
                      Viewport.horizontalSmall() && Viewport.verticalMedium()
                    }
                  />
                  <BreakpointColumn
                    cond={
                      Viewport.horizontalMedium() && Viewport.verticalMedium()
                    }
                  />
                  <BreakpointColumn
                    cond={
                      Viewport.horizontalLarge() && Viewport.verticalMedium()
                    }
                  />
                </BreakpointRow>

                <BreakpointRow>
                  <BreakpointColumn
                    cond={
                      Viewport.horizontalSmall() && Viewport.verticalLarge()
                    }
                  />
                  <BreakpointColumn
                    cond={
                      Viewport.horizontalMedium() && Viewport.verticalLarge()
                    }
                  />
                  <BreakpointColumn
                    cond={
                      Viewport.horizontalLarge() && Viewport.verticalLarge()
                    }
                  />
                </BreakpointRow>
              </BreakpointTable>
            </div>
          </React.Fragment>
        )}

        {showGrid && <VerticalGrid />}
      </React.Fragment>
    )
  }
}

export default DebugGrid
