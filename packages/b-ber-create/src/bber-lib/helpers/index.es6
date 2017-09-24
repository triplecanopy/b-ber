import fs from 'fs-extra'
import path from 'path'
import { isPlainObject, isArray } from 'lodash'
import { modelFromString, modelFromObject } from 'bber-utils'

const createPageModelsFromYAML = (arr, src) => {
    const _root = [{ nodes: [] }]
    const munge = (_arr, _result) => {
        _arr.forEach((_) => {
            // preface our function with a guard that assigns the accumulator to
            // `_root` if it lacks a `nodes` property
            let index
            let nodes

            if (isArray(_result) && _result.length - 1 > -1) {
                index = _result.length - 1
            } else {
                index = 0
            }

            if (!_result[index] || !{}.hasOwnProperty.call(_result[index], 'nodes')) {
                nodes = _root[0].nodes
            } else {
                nodes = _result[index].nodes
            }

            if (isPlainObject(_)) {
                if (Object.keys(_)[0] === 'section') { // nested section
                    munge(_[Object.keys(_)[0]], nodes)
                } else { // entry with attributes
                    const data = modelFromObject(_, src)
                    nodes.push(data)
                }
            } else { // string entry
                const data = modelFromString(_, src)
                nodes.push(data)
            }
        })
    }
    munge(arr, _root)
    return _root[0].nodes
}

const flattenNestedEntries = (arr, result = []) => {
    arr.forEach((_) => {
        if (isPlainObject(_)) { // in an entry
            result.push(_)
            if (_.nodes && _.nodes.length) {
                flattenNestedEntries(_.nodes, result)
            }
        } else {
            throw new Error(`[store#flattenNestedEntries] requires an array of Objects, [${typeof _}] provided`) // eslint-disable-line max-len
        }
    })

    return result
}

const createPagesMetaYaml = (src, type, arr = []) =>
    fs.mkdirp(path.join(process.cwd(), src), (err0) => {
        if (err0) { throw err0 }
        const content = arr.reduce((acc, curr) => acc.concat(`- ${curr.fileName}`), '')
        fs.writeFile(path.join(src, `${type}.yml`), content, (err1) => {
            if (err1) { throw err1 }
        })
    })

export { createPageModelsFromYAML, flattenNestedEntries, createPagesMetaYaml }
