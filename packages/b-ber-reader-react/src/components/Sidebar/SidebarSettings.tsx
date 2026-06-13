import classNames from 'classnames'
import React from 'react'
import type { ViewerSettingsState } from '../../store/types'

type SidebarName = 'chapters' | 'downloads' | 'metadata' | 'settings'

interface SidebarSettingsProps {
  viewerSettings: ViewerSettingsState
  showSidebar: SidebarName | null
  update: (settings: { fontSize: number | string }) => void
  save: () => void
}

interface SidebarSettingsState {
  // fontSize starts as a parsed number but is set to the raw input value (a
  // string) by handleOnChange; the arithmetic below relies on JS coercion, so
  // the runtime union is preserved here intentionally.
  fontSize: number | string
  fontSizeMin: number
  fontSizeMax: number
  fontSizeStep: number
}

class SidebarSettings extends React.Component<
  SidebarSettingsProps,
  SidebarSettingsState
> {
  constructor(props: SidebarSettingsProps) {
    super(props)

    this.state = {
      fontSize: parseInt(this.props.viewerSettings.fontSize as string, 10),
      fontSizeMin: 50,
      fontSizeMax: 250,
      fontSizeStep: 10,
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: SidebarSettingsProps) {
    const { fontSize } = nextProps.viewerSettings
    if (fontSize !== this.state.fontSize) this.setState({ fontSize })
  }

  handleFontSizeIncrement = () => this.handleFontSizeChange(1)

  handleFontSizeDecrement = () => this.handleFontSizeChange(-1)

  handleFontSizeChange = (increment: number) => {
    const { fontSizeMin, fontSizeMax, fontSizeStep } = this.state
    let { fontSize } = this.state
    fontSize = parseInt(fontSize as string, 10)
    fontSize = fontSizeStep * increment + fontSize

    if (fontSize < fontSizeMin || fontSize > fontSizeMax) return

    this.setState({ fontSize })

    this.props.update({ fontSize })
    this.props.save()
  }

  handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ fontSize: e.target.value })

  handleOnBlur = () => {
    const { fontSizeMin, fontSizeMax } = this.state
    let { fontSize } = this.state

    fontSize = Math.round((fontSize as number) * 0.1) * 10

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
          'bber-controls__sidebar',
          'bber-controls__sidebar__settings',
          {
            'bber-controls__sidebar__settings--open':
              this.props.showSidebar === 'settings',
          }
        )}
      >
        <fieldset className="bber-settings__items">
          <div className="bber-settings__item bber-settings__item--font-size">
            <label htmlFor="fontSize">Font Size</label>
            <div className="bber-settings__item__button-group bber-settings__item__button-group--horizontal">
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
