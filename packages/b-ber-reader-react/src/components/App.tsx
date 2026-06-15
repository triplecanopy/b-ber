import find from 'lodash/find'
import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as readerLocationActions from '../actions/reader-location'
import Request from '../helpers/Request'
import { useReaderStore, useStore } from '../store/StoreContext'
import type {
  AppDispatch,
  ReaderLocationState,
  ReaderSettingsState,
  RootState,
} from '../store/types'
import Reader from './Reader'

interface AppProps {
  readerLocation: ReaderLocationState
  // bindActionCreators erases the precise per-creator signatures; the bundles
  // are kept loose. TODO: tighten once dispatch typing is finalized (TASK-073).
  readerLocationActions: Record<string, (...args: any[]) => unknown>
}

function App(props: AppProps) {
  const store = useReaderStore()
  // readerSettings is read from and written to the built-in store (TASK-106);
  // manifestURL is supplied by the host and merged into the slice at seed time.
  const readerSettings = useStore(
    (s) => s.readerSettings
  ) as ReaderSettingsState & {
    manifestURL?: string
  }

  const updateSettings = (patch: Partial<ReaderSettingsState>) =>
    store.setState((s) => ({
      readerSettings: { ...s.readerSettings, ...patch },
    }))

  // The class loaded the manifest in an async UNSAFE_componentWillMount, which
  // ran before first render. The redux-driven render gate below (`return null`
  // until searchParams + bookURL are set by this load) already prevents any
  // flash of un-initialized UI, so moving the work into a mount effect preserves
  // the visible sequence: the first paint is null either way (§3a). Runs once.
  useEffect(() => {
    const loadBook = async () => {
      // Read the mount-time settings from the store snapshot (the seed merged
      // from props). The effect runs once; the store is stable.
      const initialSettings = store.getSnapshot()
        .readerSettings as ReaderSettingsState & { manifestURL?: string }
      const { manifestURL, disableBodyStyles } = initialSettings
      let { bookURL, projectURL } = initialSettings
      let books: unknown[] = []

      if (manifestURL && bookURL) {
        console.error(
          'Multiple endpoints. Specify either `manifestURL` or `bookURL`'
        )
      }

      if (disableBodyStyles !== true) {
        // Add styles to body element in case the reader is running stand-alone

        // Prevent font size change on mobile landscape
        document.body.style.setProperty('-webkit-text-size-adjust', 'none')
        document.body.style.setProperty('touch-action', 'manipulation')
        document.body.style.margin = '0'
        document.body.style.padding = '0'
      }

      if (manifestURL) {
        // Find the path to the books root directory. Assuming that the content.opf
        // is in root/OPS/, we can navigate back from there. Support for loading
        // books from a webpub manifest should be implemented properly in the future.
        // Books with a different full-path specified in the container.xml will of
        // course fail
        try {
          const resp = await Request.getJson(manifestURL)
          const { data } = resp
          const { href: opfURL } = data.resources.find(
            (res: { type: string; href: string }) =>
              res.type === 'application/oebps-package+xml'
          )

          bookURL = opfURL.split('/').slice(0, -2).join('/')

          // Must be called before state is set
          updateSettings({ bookURL })

          // Set the projectURL if not set to prevent 404 to /api/books.json
          if (!projectURL) {
            projectURL = manifestURL.slice(0, manifestURL.lastIndexOf('/'))
          }
        } catch (err) {
          console.error('Error loading Webpub manifest', err)
        }
      }

      if (bookURL && !projectURL) {
        // Path from which to load api/books.json
        projectURL = bookURL.split('/').slice(0, -2).join('/')
      }

      try {
        const resp = await Request.getBooks(projectURL)
        books = resp.data
      } catch (err) {
        console.warn('Could not load books from API', err)
      }

      // This is a bit confusing since an array of books can be returned, but the
      // settings for a single book need to be applied. This will need to be addressed
      // to either remove or re-enable the library functionality
      // There should also be a better way of syncing up the ID that exists in the book
      // other than just testing against the directory path, but since b-ber uses the
      // same value for both.
      const id = bookURL.split('/').filter(Boolean).pop()
      const book = find(books, { id }) as
        | { layout?: string; downloads?: unknown; ui_options?: unknown }
        | undefined
      const projectConfig: {
        layout?: string
        downloads?: unknown
        uiOptions?: unknown
      } = {}

      // Extend projectConfig with data returned from API
      if (book) {
        projectConfig.layout = book.layout
        projectConfig.downloads = book.downloads
        projectConfig.uiOptions = book.ui_options
      }

      // projectConfig has layout set manually if it's not defined in
      // either the API data or the React component as prop. This should
      // be handled programatically
      projectConfig.layout =
        initialSettings.layout || projectConfig.layout || 'columns'

      updateSettings({
        books: books as ReaderSettingsState['books'],
        bookURL,
        projectURL,
        // projectConfig carries API-shaped `unknown` fields (downloads/uiOptions);
        // the slice setter accepts the merged patch as the old action bundle did.
        ...projectConfig,
      } as Partial<ReaderSettingsState>)

      props.readerLocationActions.setInitialSearchParams()
    }

    loadBook()
  }, [])

  const { searchParams } = props.readerLocation
  const { bookURL } = readerSettings

  if (!searchParams || !bookURL) return null

  const { style, className, ...rest } = readerSettings

  return <Reader style={style} className={className} {...rest} />
}

const mapStateToProps = ({ readerLocation }: RootState) => ({
  readerLocation,
})

// Bound action bundles. bindActionCreators yields precise per-creator types
// that don't line up with the loose action-bundle props on AppProps; cast each
// to the loose shape so connect's prop inference matches. Behavior unchanged.
const mapDispatchToProps = (
  dispatch: AppDispatch
): Pick<AppProps, 'readerLocationActions'> => ({
  readerLocationActions: bindActionCreators(
    // The module also exports the non-function `locationStates` const, which is
    // not an action creator; cast so bindActionCreators accepts the module.
    readerLocationActions as unknown as Parameters<
      typeof bindActionCreators
    >[0],
    dispatch
  ) as unknown as AppProps['readerLocationActions'],
})

export default connect(mapStateToProps, mapDispatchToProps)(App)
