/* eslint-disable import/prefer-default-export */
import path from 'path'
import { opsPath } from '@canopycanopycanopy/b-ber-lib/utils'
import isPlainObject from 'lodash/isPlainObject'

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

const flattenSpineFromYAML = arr =>
    arr.reduce((acc, curr) => {
        if (isPlainObject(curr)) {
            if (Object.keys(curr)[0] === 'section') {
                return acc.concat(flattenSpineFromYAML(curr.section))
            }
            return acc.concat(Object.keys(curr)[0])
        }
        return acc.concat(curr)
    }, [])

const nestedContentToYAML = (arr, result = []) => {
    arr.forEach(a => {
        const model = {}

        // TODO: check for custom attrs somewhere else.
        // @issue: https://github.com/triplecanopy/b-ber/issues/208
        if (a.linear === false || a.in_toc === false) {
            if (a.in_toc === false) model.in_toc = false
            if (a.linear === false) model.linear = false
            result.push({ [a.fileName]: model })
        } else {
            result.push(a.fileName)
            if (a.nodes && a.nodes.length) {
                model.section = []
                result.push(model)
                nestedContentToYAML(a.nodes, model.section)
            }
        }
    })

    return result
}

export { pathInfoFromFiles, flattenSpineFromYAML, nestedContentToYAML }
