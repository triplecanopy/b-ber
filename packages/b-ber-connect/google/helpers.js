/* eslint-disable key-spacing */
import fs from 'fs-extra'
import path from 'path'
import Yaml from 'bber-lib/yaml'
import { isPlainObject } from 'lodash'

class Cache {
    static verifiesExistence(fpath) {
        if (!fs.existsSync(fpath)) { throw new Error(`ENOENT: ${fpath}`) }
        return fpath
    }
    static verifiesObjectType(arg) {
        if (!isPlainObject(arg)) { return {} }
        return arg
    }
    set assets(val) {
        this._assets = val
    }
    get assets() {
        if (this._assets) { return this._assets }
        const config = Yaml.load(Cache.verifiesExistence(path.join(process.cwd(), 'config.yml')))
        this.assets = Cache.verifiesObjectType(config).assets
        return this._assets
    }
}

const Cached = new Cache()
export { Cached }

// private methods
function _parseAssetValue(prop) {
    const [name, provider] = Cached.assets[prop].split('@')
    return [name, provider]
}

// @param prop {String}   Folder id or name
function _assetLocation(prop) {
    return _parseAssetValue(prop)[0]
}

// @param prop {String}   Provider name (google, dropbox, etc)
function _assetProvider(prop) {
    return _parseAssetValue(prop)[1]
}

export const locations = {
    root        : () => _assetLocation('root'),
    markdown    : () => _assetLocation('markdown'),
    images      : () => _assetLocation('images'),
    stylesheets : () => _assetLocation('stylesheets'),
    javascripts : () => _assetLocation('javascripts'),
    fonts       : () => _assetLocation('fonts'),
}

export const providers = {
    root        : () => _assetProvider('root'),
    markdown    : () => _assetProvider('markdown'),
    images      : () => _assetProvider('images'),
    stylesheets : () => _assetProvider('stylesheets'),
    javascripts : () => _assetProvider('javascripts'),
    fonts       : () => _assetProvider('fonts'),
}

// some helpers
export function prefixedAsset(str) {
    return `_${str}`
}

export function transformWithMiddleware(content) {
    return content
    // return toMarkdown(content, {
    //   converters: [{
    //     filter: ['span'],
    //     replacement: _ => _,
    //   }, {
    //     filter: ['img'],
    //     replacement: (innerHTML, node) =>
    //       `::: image:${String(Math.random()).slice(2)} source:"${node.src}"`,
    //   }]
    // })
}
