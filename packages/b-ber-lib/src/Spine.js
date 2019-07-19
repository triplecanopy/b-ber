import isPlainObject from 'lodash/isPlainObject'
import YamlAdaptor from './YamlAdaptor'
import SpineItem from './SpineItem'

class Spine {
    constructor({ src, buildType, navigationConfigFile }) {
        this.src = src
        this.buildType = buildType
        this.frontMatter = new Map()

        this.declared = this.create(navigationConfigFile)
        this.nested = this.build(this.declared, src) // nested navigation
        this.flattened = this.flatten(this.nested) // one-dimensional page flow
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
                    while (typeof acc[index - _index] === 'undefined' && _index !== acc.length) {
                        _index += 1
                    }

                    // add the nodes recursively and return the tree
                    acc[index - _index].nodes = this.build(section)
                    return acc
                }

                // curr has attributes
                const [[fileName, { ...options }]] = Object.entries(curr)
                this.frontMatter.set(fileName, {})
                node = new SpineItem({ fileName, buildType, ...options })
            } else {
                // just a plain file name
                const fileName = curr
                this.frontMatter.set(fileName, {})
                node = new SpineItem({ fileName, buildType })
            }

            return acc.concat(node)
        }, [])
    }

    flatten(arr) {
        return arr.reduce((acc, curr) => {
            const { nodes, ...rest } = curr
            const acc_ = acc.concat(rest)
            return nodes && nodes.length ? acc_.concat(this.flatten(nodes)) : acc_
        }, [])
    }

    // eslint-disable-next-line class-methods-use-this
    create(navigationConfigFile) {
        return YamlAdaptor.load(navigationConfigFile)
    }
}

export default Spine
