/* eslint-disable import/prefer-default-export */
import path from 'path'
import { opsPath } from '@canopycanopycanopy/b-ber-lib/utils'

const isRemote = file => /^http/.test(file)

const pathInfoFromFile = (file, dest) => {
  if (isRemote(file)) {
    return {
      absolutePath: file,
      opsPath: file,
      name: file,
      extension: '',
      remote: true,
    }
  }
  return {
    absolutePath: file,
    opsPath: opsPath(file, dest),
    name: path.basename(file),
    extension: path.extname(file),
    remote: false,
  }
}

const pathInfoFromFiles = (arr, dest) =>
  arr.map(file => pathInfoFromFile(file, dest))

// TODO: move into Spine class? although it's called against the toc
const nestedContentToYAML = arr =>
  arr.reduce((acc, curr) => {
    const model = {}

    if (curr.linear === false || curr.in_toc === false) {
      if (curr.linear === false) model.linear = false
      if (curr.in_toc === false) model.in_toc = false
      acc.push({ [curr.fileName]: model })
    } else {
      acc.push(curr.fileName)
      if (curr.nodes && curr.nodes.length) {
        acc.push({ section: nestedContentToYAML(curr.nodes) })
      }
    }

    return acc
  }, [])

export { pathInfoFromFiles, nestedContentToYAML }
