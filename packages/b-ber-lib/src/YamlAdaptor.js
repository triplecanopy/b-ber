import fs from 'fs-extra'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import yaml from 'js-yaml'
import log from '@canopycanopycanopy/b-ber-logger'

class YamlAdaptor {
    static toYaml(input) {
        if (typeof input === 'string') return yaml.safeDump(input)
        if (isPlainObject(input) || isArray(input)) {
            return yaml.safeDump(JSON.stringify(input))
        }

        throw new TypeError(`Invalid type: [${typeof input}]`)
    }

    static load(file) {
        let data
        try {
            data = fs.readFileSync(file, 'utf-8')
        } catch (err) {
            log.error(err)
        }
        return yaml.safeLoad(data)
    }

    static dump(str) {
        return yaml.safeDump(str, { indent: 2 })
    }

    static parse(str) {
        return yaml.safeLoad(str)
    }
}

export default YamlAdaptor
