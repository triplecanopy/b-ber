import React from 'react'
import {Layout} from './'
import Viewport from '../helpers/Viewport'

const Frame = props => {
    const {fontSize} = props.viewerSettings
    const baseStyles = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0,
        border: 0,
        fontSize,
    }
    const desktopStyles = {overflow: 'hidden'}
    const mobileStyles = {WebkitOverflowScrolling: 'touch', overflow: 'auto'}
    const styles = Viewport.isMobile() ? {...baseStyles, ...mobileStyles} : {...baseStyles, ...desktopStyles}
    return (
        <div
            id='frame'
            className={`_${props.hash}`}
            style={styles}
        >
            <Layout {...props} />
        </div>
    )
}

export default Frame
