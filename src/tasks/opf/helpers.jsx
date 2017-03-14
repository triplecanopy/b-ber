
import path from 'path'
import fs from 'fs-extra'
import { isObject, isArray, remove } from 'lodash'
import { opspath } from '../../utils'

const pathInfoFromFiles = (arr, dest) =>
  arr.map(file => ({
    rootpath: file,
    opspath: opspath(file, dest),
    name: path.basename(file),
    extension: path.extname(file)
  }))

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


export {
  pathInfoFromFiles,
  flattenYamlEntries,
  removeNestedArrayItem,
  createPagesMetaYaml
}
