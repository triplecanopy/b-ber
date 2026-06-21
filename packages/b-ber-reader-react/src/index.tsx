import React, { useState } from 'react'
import { App } from './components'
import version from './lib/version'
import { createReaderStore } from './store/createReaderStore'
import { createInitialState } from './store/initialState'
import { StoreProvider } from './store/StoreContext'
import type { ReaderSettingsState } from './store/types'

import './lib/polyfills'
import './index.scss'

// Props are merged into the `readerSettings` slice. The authoritative,
// consumer-facing prop contract (the `bookURL | manifestURL` requirement, UI
// overrides, etc.) is the hand-written public `index.d.ts`; this internal type
// stays permissive because props flow straight into `createInitialState`.
type ReaderProps = Partial<ReaderSettingsState> & Record<string, unknown>

const Version = () => (
  <meta name="generator" content={`b-ber-react-reader: ${version}`} />
)

const ConnectedApp = (props: ReaderProps = {}) => {
  // The built-in store is created once per Reader instance (lazy useState gives
  // it a stable identity that useStore's subscription depends on) and seeded
  // from the merged props.
  const [readerStore] = useState(() =>
    createReaderStore(createInitialState(props))
  )

  return (
    <StoreProvider store={readerStore}>
      <Version />
      <App />
    </StoreProvider>
  )
}

// Named export is the preferred consumer entry point
// (`import { Reader } from '...'`). The default export is kept for
// back-compat with existing consumers on `import Reader from '...'`.
export { ConnectedApp as Reader }
export default ConnectedApp
