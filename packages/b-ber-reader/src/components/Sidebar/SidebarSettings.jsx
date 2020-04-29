import React from 'react'
import classNames from 'classnames'

class SidebarSettings extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      fontSize: parseInt(this.props.viewerSettings.fontSize, 10),
      fontSizeMin: 50,
      fontSizeMax: 250,
      fontSizeStep: 10,
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { fontSize } = nextProps.viewerSettings
    if (fontSize !== this.state.fontSize) this.setState({ fontSize })
  }

  handleFontSizeIncrement = () => this.handleFontSizeChange(1)

  handleFontSizeDecrement = () => this.handleFontSizeChange(-1)

  handleFontSizeChange = increment => {
    const { fontSizeMin, fontSizeMax, fontSizeStep } = this.state
    let { fontSize } = this.state
    fontSize = parseInt(fontSize, 10)
    fontSize = fontSizeStep * increment + fontSize

    if (fontSize < fontSizeMin || fontSize > fontSizeMax) return

    this.setState({ fontSize })

    this.props.update({ fontSize })
    this.props.save()
  }

  handleOnChange = e => this.setState({ fontSize: e.target.value })

  handleOnBlur = () => {
    const { fontSizeMin, fontSizeMax } = this.state
    let { fontSize } = this.state

    fontSize = Math.round(fontSize * 0.1) * 10

    if (
      fontSize < fontSizeMin ||
      fontSize > fontSizeMax ||
      fontSize % 10 !== 0
    ) {
      return
    }

    this.setState({ fontSize })

    this.props.update({ fontSize })
    this.props.save()
  }

  render() {
    const { fontSize, fontSizeMin, fontSizeMax, fontSizeStep } = this.state

    return (
      <nav
        className={classNames(
          'controls__sidebar',
          'controls__sidebar__settings',
          {
            'controls__sidebar__settings--open':
              this.props.showSidebar === 'settings',
          }
        )}
      >
        <fieldset className="settings__items">
          <div className="settings__item settings__item--font-size">
            <label htmlFor="fontSize">Font Size</label>
            <div className="settings__item__button-group settings__item__button-group--horizontal">
              <button onClick={this.handleFontSizeDecrement}>-</button>
              <span>{fontSize}%</span>
              <input
                id="fontSize"
                type="number"
                value={fontSize}
                min={fontSizeMin}
                max={fontSizeMax}
                step={fontSizeStep}
                onChange={this.handleOnChange}
                onBlur={this.handleOnBlur}
              />
              <button onClick={this.handleFontSizeIncrement}>+</button>
            </div>
          </div>
        </fieldset>
      </nav>
    )
  }
}

export default SidebarSettings
