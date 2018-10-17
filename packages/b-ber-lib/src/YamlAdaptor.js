import _yaml from 'js-yaml'
import fs from 'fs-extra'
import { isPlainObject } from 'lodash'

/*

API to transform YAML to/from JSON and JavaScript objects. Includes convenience
wrappers for loading local files. Uses
[`js-yaml`](https://www.npmjs.com/package/js-yaml), defaulting always to
safe-mode. Doesn't perform any error checking for I/O, assumes that its being
given valid paths. All methods are currently synchronous.

*/

class YamlAdaptor {
    static read(fpath, encoding = 'utf8') {
        return fs.readFileSync(fpath, encoding)
    }

    // @param {String} strOrObj  A string (JSON) or plain JS Object
    static toYaml(strOrObj) {
        if (typeof strOrObj === 'string') {
            return _yaml.safeDump(strOrObj)
        }
        if (isPlainObject) {
            return _yaml.safeDump(JSON.stringify(strOrObj))
        }

        throw new TypeError(`Invalid type: [${typeof strOrObj}]`)
    }

    // Loads YAML from file contents
    // @param {String} fpath   File path
    // @return {Object}
    static load(fpath) {
        return _yaml.safeLoad(YamlAdaptor.read(fpath))
    }

    // @param str         JavaScript Object
    // @return {String}   YAML formatted string
    static dump(str) {
        return _yaml.safeDump(str, { indent: 2 })
    }

    // Alias for js-yaml package's `#safeLoad`.
    // @params str  YAML string
    static parse(str) {
        return _yaml.safeLoad(str)
    }
}

export default YamlAdaptor
