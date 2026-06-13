import find from 'lodash/find'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as readerLocationActions from '../actions/reader-location'
import * as readerSettingsActions from '../actions/reader-settings'
import Request from '../helpers/Request'
import type {
  AppDispatch,
  ReaderLocationState,
  ReaderSettingsState,
  RootState,
} from '../store/types'
import Reader from './Reader'

interface AppProps {
  // manifestURL is supplied by the embedding host but not part of the persisted
  // ReaderSettingsState, so it is read from the settings bag as an extra field.
  readerSettings: ReaderSettingsState & { manifestURL?: string }
  readerLocation: ReaderLocationState
  // bindActionCreators erases the precise per-creator signatures; the bundles
  // are kept loose. TODO: tighten once dispatch typing is finalized (TASK-073).
  readerSettingsActions: Record<string, (...args: any[]) => unknown>
  readerLocationActions: Record<string, (...args: any[]) => unknown>
}

class App extends Component<AppProps> {
  async UNSAFE_componentWillMount() {
    const { manifestURL, disableBodyStyles } = this.props.readerSettings
    let { bookURL, projectURL } = this.props.readerSettings
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
        this.props.readerSettingsActions.updateSettings({ bookURL })

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
      this.props.readerSettings.layout || projectConfig.layout || 'columns'

    this.props.readerSettingsActions.updateSettings({
      books: books as ReaderSettingsState['books'],
      bookURL,
      projectURL,
      ...projectConfig,
    })

    this.props.readerLocationActions.setInitialSearchParams()
  }

  render() {
    const { searchParams } = this.props.readerLocation
    const { bookURL } = this.props.readerSettings

    if (!searchParams || !bookURL) return null

    const { style, className, ...rest } = this.props.readerSettings

    return <Reader style={style} className={className} {...rest} />
  }
}

const mapStateToProps = ({ readerSettings, readerLocation }: RootState) => ({
  readerSettings,
  readerLocation,
})

// Bound action bundles. bindActionCreators yields precise per-creator types
// that don't line up with the loose action-bundle props on AppProps; cast each
// to the loose shape so connect's prop inference matches. Behavior unchanged.
const mapDispatchToProps = (
  dispatch: AppDispatch
): Pick<AppProps, 'readerSettingsActions' | 'readerLocationActions'> => ({
  readerSettingsActions: bindActionCreators(
    readerSettingsActions,
    dispatch
  ) as unknown as AppProps['readerSettingsActions'],
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
