import React, {Component} from 'react'
import {NavigationHeader, NavigationFooter} from './Navigation'
import {SidebarMetadata, SidebarDownloads, SidebarChapters, SidebarSettings} from './Sidebar'

class Controls extends Component {
    constructor(props) {
        super(props)

        this.bindKeyboardEvents = this.bindKeyboardEvents.bind(this)
        this.bindKeyboardEvents = this.bindKeyboardEvents.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
    }

    componentWillMount() {
        this.bindKeyboardEvents()
    }

    componentWillUnmount() {
        this.unBindKeyboardEvents()
    }

    handleKeyDown(e) {
        if (this.props.handleEvents === false) return
        if (!e || typeof e.which === 'undefined') return
        switch (e.which) {
            case 37: /* arrow left */
                this.props.handlePageNavigation(-1)
                this.props.handleSidebarButtonClick(null)
                break
            case 39: /* arrow right */
                this.props.handlePageNavigation(1)
                this.props.handleSidebarButtonClick(null)
                break
            case 27: /* ESC */
                this.props.handleSidebarButtonClick(null)
                break
            default:
                break
        }
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', this.handleKeyDown, false)
    }

    unBindKeyboardEvents() {
        document.removeEventListener('keydown', this.handleKeyDown, false)
    }

    render() {
        return (
            <div className='controls'>
                <NavigationHeader {...this.props} />
                <SidebarChapters {...this.props} />
                <SidebarDownloads {...this.props} />
                <SidebarMetadata {...this.props} />
                <SidebarSettings {...this.props} />

                {this.props.children}

                <NavigationFooter {...this.props} />
            </div>
        )
    }
}

export default Controls
