import React, { Component } from 'react'

class DebugGrid extends Component {
    constructor(props) {
        super(props)

        this.drawGrid = this.drawGrid.bind(this)
    }

    drawGrid() {
        const {
            gridColumns,
            gridColumnWidth,
            gridGutterWidth,
        } = this.props.viewerSettings

        const lines = []
        const paddingLeft = gridColumnWidth + gridGutterWidth

        for (let i = 0; i < gridColumns; i++) {
            const styles = { left: paddingLeft * i, width: gridColumnWidth }
            const index = i + 1
            lines.push(
                <span key={i} style={styles} className="grid__debug__line">
                    {index}
                </span>,
            )
        }

        return lines
    }

    render() {
        return <div className="grid__debug">{this.drawGrid()}</div>
    }
}

export default DebugGrid
