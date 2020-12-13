const names = new Set([
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'P',
  'LI',
  'DD',
  'DT',
  'TH',
  'TD',
  'PRE',
  'CODE',
])

const globalIndex = new Map()
let instanceIndex = []
let globalKey = 0
// let instanceIndex = new Map()

const walk = (node, func) => {
  func(node)
  node = node.firstChild
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      walk(node, func)
    }
    node = node.nextSibling
  }
}

const callback = node => {
  if (!node.innerText) return

  const innerText = node.innerText.trim()
  if (names.has(node.nodeName) && innerText /* no empty */) {
    globalIndex.set(node, innerText)
  }
}

walk(document.body, callback)

const s = 'some text'

const buildInstanceIndex = str => {
  // instanceIndex = new Map()
  instanceIndex = []

  for (const [elem, text] of globalIndex) {
    if (text.includes(str)) {
      // instanceIndex.set(elem, text)
      instanceIndex.push([elem, text])
    }
  }
}

const instanceIter = instanceIndex[Symbol.iterator]()

// let show = () =>
const show = key =>
  window.scrollTo({
    // top: instanceIter.next().value[0].offsetTop,
    top: instanceIter[key][0].offsetTop,
    behavior: 'smooth',
  })

show(globalKey)
globalKey++
