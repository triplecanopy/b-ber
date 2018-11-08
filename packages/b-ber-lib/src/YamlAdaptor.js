/*

API to transform YAML to/from JSON and JavaScript objects. Includes convenience
wrappers for loading local files. Uses
[`yawn-yaml`](https://github.com/mohsen1/yawn-yaml). Doesn't perform any error
checking for I/O, assumes that its being given valid paths. All methods are
synchronous.

*/

import fs from 'fs-extra'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'

const YAWN = require('yawn-yaml/cjs')

class YamlAdaptor {
    static read(file, encoding = 'utf8') {
        return fs.readFileSync(file, encoding)
    }

    // JSON | Object -> YAML
    // @param {String} strOrObj  A string (JSON) or plain JS Object
    static toYaml(input) {
        let yawn
        if (typeof input === 'string') {
            yawn = new YAWN(input)
            console.log('here1', yawn.yaml)
            return yawn.yaml
        }

        if (isPlainObject(input) || isArray(input)) {
            yawn = new YAWN(JSON.stringify(input))
            console.log('here2', yawn.yaml, yawn)
            return yawn.yaml
        }

        throw new TypeError(`Invalid type: [${typeof input}]`)
    }

    // IO -> YAML
    // @param {String} file   File path
    // @return {Object}
    static load(file) {
        const data = YamlAdaptor.read(file)
        const yawn = new YAWN(data)
        return yawn.json // returns plain object, no need to parse (i.e., not actually 'json')
    }

    // @param str         JSON string | object literal
    // @return {String}   YAML formatted string
    static dump(str) {
        return YamlAdaptor.toYaml(str)
    }

    // JSON -> YAML
    // @params str  YAML string
    static parse(str) {
        const yawn = new YAWN(str)
        return yawn.json // returns plain object, no need to parse (i.e., not actually 'json')
    }
}

export default YamlAdaptor
