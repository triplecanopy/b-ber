import React, { useState } from 'react'
import { Provider } from 'react-redux'
import { applyMiddleware, compose, createStore } from 'redux'
import { thunk } from 'redux-thunk'
import { App } from './components'
import { mergeDeep } from './helpers/utils'
import version from './lib/version'
import combinedReducers from './reducers'
import { initialState as initialReaderSettings } from './reducers/reader-settings'
import { createReaderStore } from './store/createReaderStore'
import { createInitialState } from './store/initialState'
import { StoreProvider } from './store/StoreContext'
import type { ReaderSettingsState } from './store/types'

import './lib/polyfills'
import 'material-icons/iconfont/filled.css'
import './index.scss'

// Props are merged into the `readerSettings` slice. The authoritative,
// consumer-facing prop contract (the `bookURL | manifestURL` requirement, UI
// overrides, etc.) is the hand-written public `index.d.ts`; this internal type
// stays permissive because props flow straight into `mergeDeep`.
type ReaderProps = Partial<ReaderSettingsState> & Record<string, unknown>

const Version = () => (
  <meta name="generator" content={`b-ber-react-reader: ${version}`} />
)

const ConnectedApp = (props: ReaderProps = {}) => {
  const store = createStore(
    combinedReducers,
    { readerSettings: mergeDeep(initialReaderSettings, props) },
    compose(applyMiddleware(thunk))
  )

  // The built-in store runs alongside Redux while slices migrate (TASK-106).
  // Lazy `useState` gives it a stable identity for the Reader instance's life,
  // which `useStore`'s subscription depends on. Seeded from the same props.
  const [readerStore] = useState(() =>
    createReaderStore(createInitialState(props))
  )

  return (
    <Provider store={store}>
      <StoreProvider store={readerStore}>
        <Version />
        <App />
      </StoreProvider>
    </Provider>
  )
}

// Named export is the preferred consumer entry point
// (`import { Reader } from '...'`). The default export is kept for
// back-compat with existing consumers on `import Reader from '...'`.
export { ConnectedApp as Reader }
export default ConnectedApp
