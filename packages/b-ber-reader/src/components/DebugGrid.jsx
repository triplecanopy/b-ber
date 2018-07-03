import React, {Component} from 'react'

class DebugGrid extends Component {
    constructor(props) {
        super(props)

        this.drawGrid = this.drawGrid.bind(this)
    }

    drawGrid() {
        const {gridColumns, paddingLeft} = this.props.viewerSettings
        const lines = []

        let left
        for (let i = 0; i < gridColumns; i++) {
            left = paddingLeft * (i + 1)
            lines.push(
                <span
                    key={i}
                    style={{left}}
                    className='grid__debug__line'
                />
            )
        }

        return lines
    }

    render() {
        return (
            <div className='grid__debug'>
                {this.drawGrid()}
            </div>
        )
    }
}

export default DebugGrid
