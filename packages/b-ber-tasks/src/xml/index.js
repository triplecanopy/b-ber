import path from 'path'
import fs from 'fs-extra'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import log from '@canopycanopycanopy/b-ber-logger'
import HtmlToXml from '@canopycanopycanopy/b-ber-lib/HtmlToXml'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

const cwd = process.cwd()

const formatForInDesign = str => {
    let str_ = str
    str_ = str_.replace(/<!--[\s\S]*?-->/g, '')
    str_ = str_.replace(/\/pagebreak>[\s\S]*?</g, '/pagebreak><')
    return Promise.resolve(str_)
}

const writeXML = str => {
    const uuid = getBookMetadata('identifier', state)
    const fpath = path.join(cwd, `${uuid}.xml`)
    return fs.writeFile(fpath, str, 'utf8')
}

const parseHTMLFiles = files =>
    new Promise(resolve => {
        const contents = files
            .reduce((acc, curr) => {
                const fname = isPlainObject(curr) ? Object.keys(curr)[0] : isString(curr) ? curr : null
                const ext = '.xhtml'

                if (!fname) return acc

                const fpath = `${fname}${ext}`
                const data = fs.readFileSync(fpath, 'utf8')

                return acc.concat(`${data}`)
            }, [])
            .join('<pagebreak></pagebreak>')

        const parser = new HtmlToXml()
        parser.onend = resolve
        parser.parse(contents)
    })

const xml = () => {
    const files = state.spine.map(entry => entry.absolutePath)
    return parseHTMLFiles(files)
        .then(formatForInDesign)
        .then(writeXML)
        .catch(log.error)
}

export default xml
