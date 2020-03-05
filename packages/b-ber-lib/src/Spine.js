import path from 'path'
import glob from 'glob'
import isUndefined from 'lodash/isUndefined'
import isPlainObject from 'lodash/isPlainObject'
import difference from 'lodash/difference'
import YamlAdaptor from './YamlAdaptor'
import SpineItem from './SpineItem'

class Spine {
  constructor({ src, buildType, navigationConfigFile }) {
    this.src = src
    this.buildType = buildType
    this.frontMatter = new Map()
    this.navigationConfigFile = navigationConfigFile

    this.entries = this.create()
    this.nested = this.build(this.entries) // nested navigation
    this.flattened = this.flattenNodes(this.nested) // one-dimensional page flow
  }

  build(entries = []) {
    const { buildType } = this
    return entries.reduce((acc, curr, index) => {
      // create new spine item
      let node
      // check if it either has nested entries or attributes that have
      // been assigned in the yaml file
      if (isPlainObject(curr)) {
        // we know that nested navigation is wrapped in a `section`
        // object so we check against that
        const { section } = curr
        if (section) {
          // curr has nested navigation. attach the nodes to the
          // previous entry in the tree by querying the last index
          let _index = 0
          while (isUndefined(acc[index - _index]) && _index !== acc.length) {
            _index += 1
          }

          // add the nodes recursively and return the tree
          acc[index - _index].nodes = this.build(section)
          return acc
        }

        // curr has attributes
        const [[fileName, { ...options }]] = Object.entries(curr)
        // also set frontmatter for easy access later
        this.frontMatter.set(fileName, {})
        node = new SpineItem({ fileName, buildType, ...options })
      } else {
        // just a plain file name
        const fileName = curr
        // also set frontmatter for easy access later
        this.frontMatter.set(fileName, {})
        node = new SpineItem({ fileName, buildType })
      }

      return acc.concat(node)
    }, [])
  }

  flattenNodes(arr) {
    return arr.reduce((acc, curr) => {
      const { nodes, ...rest } = curr
      const acc_ = acc.concat(rest)
      return nodes && nodes.length
        ? acc_.concat(this.flattenNodes(nodes))
        : acc_
    }, [])
  }

  flattenYAML(data = []) {
    return data.reduce((acc, curr) => {
      if (isPlainObject(curr)) {
        if (Object.keys(curr)[0] === 'section') {
          return acc.concat(this.flattenYAML(curr.section))
        }
        return acc.concat(Object.keys(curr)[0])
      }
      return acc.concat(curr)
    }, [])
  }

  create() {
    const pattern = path.resolve(this.src, '_markdown', '*.md')
    const declaredFiles = YamlAdaptor.load(this.navigationConfigFile)
    const flattenedFiles = this.flattenYAML(declaredFiles)
    const systemFileNames = glob
      .sync(pattern)
      .map(file => path.basename(file, '.md'))
    const missingEntries = difference(systemFileNames, flattenedFiles)
    const entries = declaredFiles.concat(missingEntries)

    return entries
  }
}

export default Spine
