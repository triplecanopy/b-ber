import isPlainObject from 'lodash/isPlainObject'
import head from 'lodash/head'
import tail from 'lodash/tail'
import YamlAdaptor from './YamlAdaptor'
import SpineItem from './SpineItem'

class Spine {
    constructor({ src, buildType }) {
        this.src = src
        this.buildType = buildType
    }

    build(entries = []) {
        const { buildType } = this
        return entries.map(entry => {
            // create new spine item
            let node
            // check if it either has nested entries or attributes that have
            // been assigned in the yaml file
            if (isPlainObject(entry)) {
                // we know that nested navigation is wrapped in a `section`
                // object so we check against that
                const { section } = entry
                if (section) {
                    // entry has nested navigation. set the filename and recurse
                    // over the child nodes
                    node = new SpineItem({
                        fileName: head(section),
                        nodes: this.build(tail(section)),
                        buildType,
                    })
                } else {
                    // entry has attributes
                    const [[fileName, { ...options }]] = Object.entries(entry)
                    node = new SpineItem({ fileName, buildType, ...options })
                }
            } else {
                // just a plain file name
                const fileName = entry
                node = new SpineItem({ fileName, buildType })
            }

            return node
        })
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
