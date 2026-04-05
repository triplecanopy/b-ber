import Asset from '../../helpers/Asset'
import Request from '../../helpers/Request'
import Storage from '../../helpers/Storage'
import XMLAdaptor from '../../helpers/XMLAdaptor'

export const book = { content: null }

export async function createStateFromOPF(callback) {
  const { bookURL } = this.props.readerSettings

  const opfURL = XMLAdaptor.opfURL(bookURL)
  const opsURL = XMLAdaptor.opsURL(bookURL)

  let data
  let guideItems
  let spineItems

  data = await Request.getText(opfURL)
  data = await XMLAdaptor.parseOPF(data)
  data = await XMLAdaptor.parseNCX(data, opsURL)
  ;[guideItems, spineItems] = await Promise.all([
    XMLAdaptor.createGuideItems(data),
    XMLAdaptor.createSpineItems(data),
  ])

  data = { ...guideItems, ...spineItems }
  ;[guideItems, spineItems] = await Promise.all([
    XMLAdaptor.udpateGuideItemURLs(data, opsURL),
    XMLAdaptor.udpateSpineItemURLs(data, opsURL),
  ])

  data = { ...guideItems, ...spineItems }
  data = await XMLAdaptor.createBookMetadata(data)

  // console.log('opsURL, ...data')
  // console.log(opsURL, data)

  this.setState({ opsURL, ...data }, callback)
}

// Shows content and enables UI once book content has been loaded
export function showSpineItem() {
  const { spine, spreadIndex, currentSpineItemIndex } = this.state
  const { lastSpreadIndex } = this.props.view

  const firstChapter = currentSpineItemIndex === 0
  const lastChapter = currentSpineItemIndex === spine.length - 1
  const firstSpread = spreadIndex === 0
  const lastSpread = spreadIndex === lastSpreadIndex

  this.setState({ firstChapter, lastChapter, firstSpread, lastSpread }, () => {
    // console.log('showSpineItem:after setstate')

    this.savePosition()

    // console.log('this.props.userInterfaceActions.update')

    // this.props.userInterfaceActions.update({
    //   handleEvents: true,
    //   spinnerVisible: false,
    // })
  })
}

// Makes requests to load book content
export async function loadSpineItem(spineItem, deferredCallback) {
  const hash = Asset.createHash(this.props.readerSettings.bookURL)

  let requestedSpineItem = spineItem

  // Fall back to the first spine item when no explicit item is provided
  // (e.g. initial load with no saved position)
  if (!requestedSpineItem) [requestedSpineItem] = this.state.spine

  // Guard: spine may be empty if called before createStateFromOPF has
  // completed. This should not happen in normal flow (the initialization
  // effect now shows the spinner with handleEvents:false before the OPF
  // fetch begins), but defensive checks prevent a crash if it does.
  if (!requestedSpineItem) {
    console.warn('loadSpineItem: called before spine was populated — skipping')
    return
  }

  this.freeze()

  let content

  try {
    const { cache, opsURL } = this.state
    const { data, request } = await Request.getText(
      requestedSpineItem.absoluteURL
    )

    content = await XMLAdaptor.parseSpineItemResponse({
      data,
      hash,
      cache,
      opsURL,
      request,
      requestedSpineItem,
      paddingLeft: this.props.viewerSettings.paddingLeft,
      columnGap: this.props.viewerSettings.columnGap,
    })
  } catch (err) {
    // Something went wrong loading the book. Clear storage for this book
    // and re-enable the UI so the reader is not left in a frozen state.
    // Addresses IMPROVEMENT_PLAN.md M2.
    //
    // TODO retry? try to navigate to home?
    // @issue: https://github.com/triplecanopy/b-ber/issues/214
    console.error(err)

    const storage = Storage.get() || {}

    delete storage[hash]
    Storage.set(storage)

    // Re-enable the UI — freeze() was called before the try block and the
    // spinner would otherwise remain visible indefinitely after a failure
    this.props.userInterfaceActions.update({
      handleEvents: true,
      spinnerVisible: false,
    })

    return
  }

  const { bookContent, scopedCSS } = content

  // eslint-disable-next-line no-param-reassign
  book.content = bookContent

  Asset.appendBookStyles(scopedCSS, hash)

  this.setState(
    {
      currentSpineItem: requestedSpineItem,
      spineItemURL: requestedSpineItem.absoluteURL,
    },
    () => {
      // Update the query string to trigger a page transition and call the
      // deferredCallback if one is set, or `showSpineItem` if not

      // console.log('loadSpineItem setstate:after')
      this.updateQueryString(() => {
        // console.log('loadSpineItem setstate:after updateqs', deferredCallback)

        this.showSpineItem()

        // this.props.registerDeferredCallback(
        //   deferredCallback || this.showSpineItem
        // )
      })
    }
  )
}
