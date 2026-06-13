import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
import type { ViewerSettingsState } from '../../store/types'

type SidebarName = 'chapters' | 'downloads' | 'metadata' | 'settings'

interface SidebarSettingsProps {
  viewerSettings: ViewerSettingsState
  showSidebar: SidebarName | null
  update: (settings: { fontSize: number | string }) => void
  save: () => void
}

// fontSize starts as a parsed number but is set to the raw input value (a
// string) by handleOnChange; the arithmetic below relies on JS coercion, so
// the runtime union is preserved here intentionally.
type FontSize = number | string

const fontSizeMin = 50
const fontSizeMax = 250
const fontSizeStep = 10

function SidebarSettings({
  viewerSettings,
  showSidebar,
  update,
  save,
}: SidebarSettingsProps) {
  const [fontSize, setFontSize] = useState<FontSize>(() =>
    parseInt(viewerSettings.fontSize as string, 10)
  )

  useEffect(() => {
    setFontSize((prev) =>
      viewerSettings.fontSize !== prev ? viewerSettings.fontSize : prev
    )
  }, [viewerSettings.fontSize])

  const handleFontSizeChange = (increment: number) => {
    let next: FontSize = parseInt(fontSize as string, 10)
    next = fontSizeStep * increment + next

    if (next < fontSizeMin || next > fontSizeMax) return

    setFontSize(next)

    update({ fontSize: next })
    save()
  }

  const handleFontSizeIncrement = () => handleFontSizeChange(1)

  const handleFontSizeDecrement = () => handleFontSizeChange(-1)

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFontSize(e.target.value)

  const handleOnBlur = () => {
    let next: FontSize = fontSize

    next = Math.round((next as number) * 0.1) * 10

    if (next < fontSizeMin || next > fontSizeMax || next % 10 !== 0) {
      return
    }

    setFontSize(next)

    update({ fontSize: next })
    save()
  }

  return (
    <nav
      className={classNames(
        'bber-controls__sidebar',
        'bber-controls__sidebar__settings',
        {
          'bber-controls__sidebar__settings--open': showSidebar === 'settings',
        }
      )}
    >
      <fieldset className="bber-settings__items">
        <div className="bber-settings__item bber-settings__item--font-size">
          <label htmlFor="fontSize">Font Size</label>
          <div className="bber-settings__item__button-group bber-settings__item__button-group--horizontal">
            <button onClick={handleFontSizeDecrement}>-</button>
            <span>{fontSize}%</span>
            <input
              id="fontSize"
              type="number"
              value={fontSize}
              min={fontSizeMin}
              max={fontSizeMax}
              step={fontSizeStep}
              onChange={handleOnChange}
              onBlur={handleOnBlur}
            />
            <button onClick={handleFontSizeIncrement}>+</button>
          </div>
        </div>
      </fieldset>
    </nav>
  )
}

export default SidebarSettings
