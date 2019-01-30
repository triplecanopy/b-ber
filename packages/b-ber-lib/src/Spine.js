import fs from 'fs-extra'
import path from 'path'
import { isPlainObject, isArray } from 'lodash'
import log from '@canopycanopycanopy/b-ber-logger'
import YamlAdaptor from './YamlAdaptor'
import SpineItem from './SpineItem'

const cwd = process.cwd()

class Spine {
    constructor({ src, buildType }) {
        this.src = src
        this.buildType = buildType
        this.root = [{ nodes: [] }]
    }

    build(arr, result) {
        arr.forEach(a => {
            let index
            let nodes

            if (isArray(result) && result.length - 1 > -1) {
                index = result.length - 1
            } else {
                index = 0
            }

            if (!result[index] || !{}.hasOwnProperty.call(result[index], 'nodes')) {
                nodes = this.root[0].nodes
            } else {
                nodes = result[index].nodes
            }

            if (isPlainObject(a)) {
                if (Object.keys(a)[0] === 'section') {
                    // nested section
                    this.build(a[Object.keys(a)[0]], nodes)
                } else {
                    // entry with attributes
                    const fileName = Object.keys(a)[0]
                    const options = a[Object.keys(a)[0]]
                    const data = new SpineItem({ fileName, ...options })
                    nodes.push(data)
                }
            } else {
                // string entry
                const data = new SpineItem({ fileName: a })
                nodes.push(data)
            }
        })

        return this.root[0].nodes
    }

    flatten(arr, result = []) {
        arr.forEach(a => {
            result.push(a)
            if (a.nodes && a.nodes.length) this.flatten(a.nodes, result)
        })

        return result
    }

    createSpineListFromMarkdown() {
        const markdownDir = path.join(cwd, this.src, '_markdown')
        return fs
            .readdirSync(markdownDir)
            .filter(a => path.extname(a) === '.md')
            .map(a => path.basename(a, '.md'))
    }

    // eslint-disable-next-line class-methods-use-this
    createSpineListFromConfig(navigationConfigFile) {
        return YamlAdaptor.load(navigationConfigFile) || []
    }

    create(navigationConfigFile) {
        let spineList = []
        try {
            if (fs.existsSync(navigationConfigFile)) {
                spineList = this.createSpineListFromConfig(navigationConfigFile)
            } else {
                throw new Error(`creating default file [${this.buildType}.yml]`)
            }
        } catch (err) {
            if (/creating default file/.test(err.message)) {
                log.warn(err.message)
                fs.writeFileSync(navigationConfigFile, '')
                spineList = this.createSpineListFromMarkdown()
            } else {
                throw err
            }
        }

        return spineList
    }
}

export default Spine
