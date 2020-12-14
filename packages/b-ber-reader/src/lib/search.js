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

let search = ''
let instanceIndex = []
let instanceKey = 0

const walk = (node, callback) => {
  callback(node)

  let child = node.firstChild

  while (child) {
    if (child.nodeType === window.Node.ELEMENT_NODE) {
      walk(child, callback)
    }

    child = child.nextSibling
  }
}

const callback = node => {
  if (!node.innerText) return

  const innerText = node.innerText.trim()
  if (names.has(node.nodeName) && innerText /* no empty */) {
    globalIndex.set(node, innerText)
  }
}

const buildInstanceIndex = str => {
  instanceIndex = []
  instanceKey = 0

  for (const [elem, text] of globalIndex) {
    if (text.includes(str)) {
      instanceIndex.push([elem, text])
    }
  }
}

// https://developer.mozilla.org/en-US/docs/Web/API/Text/splitText
const show = () => {
  if (!instanceIndex.length) return

  const [node /* , text*/] = instanceIndex[instanceKey]
  const textNode = node.firstChild
  const startIdx = textNode.nodeValue.indexOf(search)
  const endIdx = search.length

  const word = textNode.splitText(startIdx)
  const after = word.splitText(endIdx)

  const mark = document.createElement('mark')
  mark.appendChild(word)

  node.insertBefore(mark, after)
}

const inc = () => {
  const len = instanceIndex.length
  if (!len) return
  instanceKey = (instanceKey + 1) % len
}

const dec = () => {
  const len = instanceIndex.length
  if (!len) return
  instanceKey = (instanceKey - 1 + len) % len
}

const handleNext = e => {
  e.preventDefault()
  inc()
  show()
}

const handlePrev = e => {
  e.preventDefault()
  dec()
  show()
}

const handleOnLoad = () => {
  walk(document.body, callback)

  const input = document.querySelector('[name="s"]')
  const prev = document.querySelector('[name="prev"]')
  const next = document.querySelector('[name="next"]')

  const handleKeydown = () => {
    search = input.value
    buildInstanceIndex(search)
    show()
  }

  let timer
  const debounceHandleKeydown = () => {
    clearTimeout(timer)
    timer = setTimeout(handleKeydown, 60)
  }

  input.addEventListener('keydown', debounceHandleKeydown)
  next.addEventListener('click', handleNext)
  prev.addEventListener('click', handlePrev)
}

window.onload = handleOnLoad
