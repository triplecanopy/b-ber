import path from 'node:path'
import glob from 'glob'
import difference from 'lodash/difference'
import SpineItem from './SpineItem'
import YamlAdaptor from './YamlAdaptor'

// One entry of toc.yml as YAML parses it: a file name, a file name mapped to
// its attributes, or a `section` of nested entries
export type NavigationEntry =
  | string
  | { section: NavigationEntry[] }
  | { [fileName: string]: Record<string, unknown> }

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
  entries: NavigationEntry[]
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

  build(entries: NavigationEntry[] = []): SpineItem[] {
    const { buildType } = this
    return entries.reduce((acc: SpineItem[], curr, index: number) => {
      // create new spine item
      let node: SpineItem
      // check if it either has nested entries or attributes that have
      // been assigned in the yaml file
      if (typeof curr === 'object' && curr !== null && !Array.isArray(curr)) {
        // we know that nested navigation is wrapped in a `section`
        // object so we check against that
        const { section } = curr as { section?: NavigationEntry[] }
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
        const [[fileName, options]] = Object.entries(curr) as [
          [string, Record<string, unknown>],
        ]
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

  flattenYAML(data: NavigationEntry[] = []): string[] {
    return data.reduce((acc: string[], curr) => {
      if (typeof curr === 'object' && curr !== null && !Array.isArray(curr)) {
        if (Object.keys(curr)[0] === 'section') {
          return acc.concat(
            this.flattenYAML((curr as { section: NavigationEntry[] }).section)
          )
        }
        return acc.concat(Object.keys(curr)[0])
      }
      return acc.concat(curr)
    }, [])
  }

  create(): NavigationEntry[] {
    const pattern = path.resolve(this.src, '_markdown', '*.md')
    // toc.yml is author input and is not validated
    const declaredFiles = YamlAdaptor.load(
      this.navigationConfigFile
    ) as NavigationEntry[]
    const flattenedFiles = this.flattenYAML(declaredFiles)
    const systemFileNames = glob
      .sync(pattern)
      .map((file) => path.basename(file, '.md'))
    const missingEntries = difference(systemFileNames, flattenedFiles)
    const entries = declaredFiles.concat(missingEntries)

    return entries
  }
}

export default Spine
