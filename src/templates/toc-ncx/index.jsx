
import File from 'vinyl'
import { find } from 'lodash'
import { metadata, env } from '../../utils'

const ncxHead = () => {
  const entry = find(metadata(), { term: 'identifier' })
  const identifier = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : ''
  return `<head>
    <meta name="dtb:uid" content="${identifier}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="1"/>
    <meta name="dtb:maxPageNumber" content="1"/>
  </head>`
}

const ncxTitle = () => {
  const entry = find(metadata(), { term: 'title' })
  const title = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : ''
  return `<docTitle>
    <text>${title}</text>
  </docTitle>`
}

const ncxAuthor = () => {
  const entry = find(metadata(), { term: 'creator' })
  const creator = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : ''
  return `<docAuthor>
    <text>${creator}</text>
  </docAuthor>`
}

const ncxTmpl = new File({
  path: 'ncxTmpl.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8"?>
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
      ${ncxHead()}
      ${ncxTitle()}
      ${ncxAuthor()}
        <navMap>
          {% body %}
        </navMap>
      </ncx>`)
})

const navPoint = (list) => {
  let i = 0
  function render(arr) {
    return arr.map((_, j) => {
      i += 1
      if (!_.opspath) { return '' }
      return `
        <navPoint id="navPoint-${i}" playOrder="${i}">
        <navLabel><text>${_.section_title || _.name}</text></navLabel>
        <content src="${_.opspath}"/>
        ${(arr[j + 1] && arr[j + 1].constructor === Array) ? render(arr[j + 1]) : ''}
        </navPoint>`
    })
    .join('')
  }
  return env() === 'production' ? render(list).replace(/\s*\n\s*/g, '') : render(list)
}

export { ncxTmpl, navPoint }
