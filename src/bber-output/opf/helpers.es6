import path from 'path'
import fs from 'fs-extra'
import Props from 'bber-lib/props'
import store from 'bber-lib/store'
import { isObject, isPlainObject, isArray, remove, findIndex, find } from 'lodash'
import { opsPath, dist } from 'bber-utils'

const cwd = process.cwd()

const pathInfoFromFile = (file, dest) => ({
  rootPath: file,
  opsPath: opsPath(file, dest),
  name: path.basename(file),
  extension: path.extname(file),
})

const pathInfoFromFiles = (arr, dest) =>
  arr.map(file => pathInfoFromFile(file, dest))

const flattenYamlEntries = (arr, result = []) => {
  if (isArray(arr)) {
    arr.forEach((_) => {
      if (isObject(_)) {
        flattenYamlEntries(_[Object.keys(_)[0]], result)
      } else {
        result.push(_)
      }
    })
  }
  return result
}

const removeNestedArrayItem = (arr, itemName) => {
  if (isArray(arr)) {
    remove(arr, a => a === itemName)
    arr.forEach((b) => {
      if (isObject(b)) {
        removeNestedArrayItem(b[Object.keys(b)[0]], itemName)
      }
    })
  }
  return arr
}

const createPagesMetaYaml = (input, buildType, arr = []) =>
  fs.writeFile(
    path.join(input, `${buildType}.yml`),
    `---\n${arr.map(_ => `- ${_}.xhtml`).join('\n')}`,
    (err) => { if (err) { throw err } }
  )

const buildNavigationObjects = (data, dest, result = []) => {
  data.forEach((_) => {
    if (isPlainObject(_) && {}.hasOwnProperty.call(_, 'section')) {
      const childIndex = (result.push([])) - 1
      buildNavigationObjects(_.section, dest, result[childIndex])
    } else {
      // TODO: there should be more complete file info in `store.pages`, e.g.,
      // full path
      const ref = find(store.pages, { filename: path.basename(_, '.xhtml') })
      let textPath = 'text'
      if (!ref && _ === 'toc.xhtml') { textPath = '' }
      result.push({
        filename: _,
        name: path.basename(_, '.xhtml'),
        rootPath: path.join(cwd, dist(), 'OPS', textPath, _),
        opsPath: path.resolve(`/${textPath}/${_}`),
        extension: path.extname(_),
        title: ref ? (ref.title || '') : '',
        type: ref ? (ref.type || '') : '',
      })
    }
  })

  return result
}

const nestedLinearContent = (pages) => {
  const _pages = Array.prototype.slice.call(pages, 0)
  const nonLinearIndex = findIndex(_pages, 'nonLinear')
  _pages.splice(nonLinearIndex, 1)
  return _pages
}

const sortNavigationObjects = (flow, fileObjects) => {
  const result = []
  const files = fileObjects.filter(_ => Props.isHTML(_))
  result.length = files.length
  files.forEach((_) => {
    // TODO: file objects across the app should either sync or the number of
    // them should be reduced
    const ref = find(store.pages, { filename: path.basename(_.name, _.extension) })
    const index = flow.indexOf(path.basename(_.name, _.extension))
    if (index > -1) {
      let linear = 'yes'
      if (ref && ref.linear) { linear = ref.linear }
      result[index] = { ..._, linear }
    }
  })
  return result
}

export { pathInfoFromFiles, flattenYamlEntries, removeNestedArrayItem,
  createPagesMetaYaml, buildNavigationObjects, nestedLinearContent,
  sortNavigationObjects }
