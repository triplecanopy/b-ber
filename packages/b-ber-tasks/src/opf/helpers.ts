/* eslint-disable import/prefer-default-export */

import { opsPath } from '@canopycanopycanopy/b-ber-lib/utils'
import path from 'path'

const isRemote = (file: string) => /^http/.test(file)

const pathInfoFromFile = (file: string, dest: string) => {
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

const pathInfoFromFiles = (arr: string[], dest: string) =>
  arr.map((file: string) => pathInfoFromFile(file, dest))

// TODO: move into Spine class? although it's called against the toc
const nestedContentToYAML = (arr: any[]) =>
  arr.reduce((acc: any[], curr: any) => {
    const model: Record<string, boolean> = {}

    if (curr.linear === false || curr.in_toc === false) {
      if (curr.linear === false) model.linear = false
      // eslint-disable-next-line camelcase
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

export { nestedContentToYAML, pathInfoFromFiles }
