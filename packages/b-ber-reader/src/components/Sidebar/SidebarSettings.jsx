import React, {Component} from 'react'
import classNames from 'classnames'

class SidebarSettings extends Component {
    constructor(props) {
        super(props)

        this.state = {
            fontSize: this.props.viewerSettings.get('fontSize'),
            fontSizeMin: 50,
            fontSizeMax: 250,
            fontSizeStep: 10,
        }

        this.handleFontSizeIncrement = this.handleFontSizeIncrement.bind(this)
    }
    componentWillReceiveProps(nextProps) {
        const fontSize = nextProps.viewerSettings.get('fontSize')
        if (fontSize !== this.state.fontSize) this.setState({fontSize})
    }
    handleFontSizeIncrement(increment) {
        const {fontSizeMin, fontSizeMax, fontSizeStep} = this.state
        let {fontSize} = this.state
        fontSize = parseInt(fontSize, 10)
        fontSize = (fontSizeStep * increment) + fontSize

        if (fontSize < fontSizeMin || fontSize > fontSizeMax) return

        this.setState({fontSize})
        this.props.updateViewerSettings({fontSize})
    }
    render() {
        // const {
        //     // columnGapPage,      // columnGapPage 30
        //     // columnGapLayout,    // columnGapLayout 120
        //     // fontSize,           // fontSize 120
        //     // paddingBottom,      // paddingBottom 30
        //     // paddingLeft,        // paddingLeft 30
        //     // paddingRight,       // paddingRight 30
        //     // paddingTop,         // paddingTop 30
        //     // theme,              // theme "default"
        //     // transition,         // transition "slide"
        //     // transitionSpeed,    // transitionSpeed 400
        // } = this.props.viewerSettings

        const {
            fontSize,
            fontSizeMin,
            fontSizeMax,
            fontSizeStep,
        } = this.state

        return (
            <nav
                className={classNames(
                    'controls__sidebar',
                    'controls__sidebar__settings',
                    {'controls__sidebar__settings--open': this.props.showSidebar === 'settings'}
                )}
            >
                <fieldset className='settings__items'>
                    <div className='settings__item settings__item--font-size'>
                        <label htmlFor='fontSize'>Font Size</label>
                        <div className='settings__item__button-group settings__item__button-group--horizontal'>
                            <button onClick={_ => this.handleFontSizeIncrement(-1)}>-</button>
                            <span>{fontSize}%</span>
                            <input
                                id='fontSize'
                                type='number'
                                value={fontSize}
                                min={fontSizeMin}
                                max={fontSizeMax}
                                step={fontSizeStep}
                                onChange={e => {
                                    this.setState({fontSize: e.target.value})
                                }}
                                onBlur={_ => {
                                    let {fontSize} = this.state
                                    fontSize = Math.round(fontSize * 0.1) * 10
                                    if (fontSize < fontSizeMin || fontSize > fontSizeMax || fontSize % 10 !== 0) return

                                    this.setState({fontSize})
                                    this.props.updateViewerSettings({fontSize})
                                }}
                            />
                            <button onClick={_ => this.handleFontSizeIncrement(1)}>+</button>
                        </div>
                    </div>
                </fieldset>
            </nav>
        )
    }
}

export default SidebarSettings
