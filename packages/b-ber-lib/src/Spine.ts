import path from 'path'
import glob from 'glob'
import difference from 'lodash/difference'
import YamlAdaptor from './YamlAdaptor'
import SpineItem from './SpineItem'

interface SpineOptions {
  src: string
  buildType: string
  navigationConfigFile: string
}

class Spine {
  src: string
  buildType: string
  frontMatter: Map<string, Record<string, unknown>>
  navigationConfigFile: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entries: any[]
  nested: SpineItem[]
  flattened: Omit<SpineItem, 'nodes'>[]

  constructor({ src, buildType, navigationConfigFile }: SpineOptions) {
    this.src = src
    this.buildType = buildType
    this.frontMatter = new Map()
    this.navigationConfigFile = navigationConfigFile

    this.entries = this.create()
    this.nested = this.build(this.entries) // nested navigation
    this.flattened = this.flattenNodes(this.nested) // one-dimensional page flow
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build(entries: any[] = []): SpineItem[] {
    const { buildType } = this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return entries.reduce((acc: SpineItem[], curr: any, index: number) => {
      // create new spine item
      let node: SpineItem
      // check if it either has nested entries or attributes that have
      // been assigned in the yaml file
      if (typeof curr === 'object' && curr !== null && !Array.isArray(curr)) {
        // we know that nested navigation is wrapped in a `section`
        // object so we check against that
        const { section } = curr
        if (section) {
          // curr has nested navigation. attach the nodes to the
          // previous entry in the tree by querying the last index
          let _index = 0
          while (acc[index - _index] === undefined && _index !== acc.length) {
            _index += 1
          }

          // add the nodes recursively and return the tree
          acc[index - _index].nodes = this.build(section)
          return acc
        }

        // curr has attributes
        const [[fileName, options]] = Object.entries(curr) as [[string, Record<string, unknown>]]
        // also set frontmatter for easy access later
        this.frontMatter.set(fileName, {})
        node = new SpineItem({ fileName, buildType, ...options })
      } else {
        // just a plain file name
        const fileName = curr as string
        // also set frontmatter for easy access later
        this.frontMatter.set(fileName, {})
        node = new SpineItem({ fileName, buildType })
      }

      return acc.concat(node)
    }, [])
  }

  flattenNodes(arr: SpineItem[]): Omit<SpineItem, 'nodes'>[] {
    return arr.reduce((acc: Omit<SpineItem, 'nodes'>[], curr: SpineItem) => {
      const { nodes, ...rest } = curr
      const acc_ = acc.concat(rest)
      return nodes && nodes.length
        ? acc_.concat(this.flattenNodes(nodes))
        : acc_
    }, [])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flattenYAML(data: any[] = []): string[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.reduce((acc: string[], curr: any) => {
      if (typeof curr === 'object' && curr !== null && !Array.isArray(curr)) {
        if (Object.keys(curr)[0] === 'section') {
          return acc.concat(this.flattenYAML(curr.section))
        }
        return acc.concat(Object.keys(curr)[0])
      }
      return acc.concat(curr)
    }, [])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(): any[] {
    const pattern = path.resolve(this.src, '_markdown', '*.md')
    const declaredFiles = YamlAdaptor.load(this.navigationConfigFile) as unknown[]
    const flattenedFiles = this.flattenYAML(declaredFiles as unknown[])
    const systemFileNames = glob
      .sync(pattern)
      .map(file => path.basename(file, '.md'))
    const missingEntries = difference(systemFileNames, flattenedFiles)
    const entries = (declaredFiles as unknown[]).concat(missingEntries)

    return entries
  }
}

export default Spine
