
/**
 * @module pdf
 */

import Promise from 'zousan'
import path from 'path'
import fs from 'fs-extra'
import store from 'bber-lib/store'
import html2pdf from 'html-pdf'
import Printer from 'bber-modifiers/printer'
import log from 'b-ber-logger'
import { dist, parseHTMLFiles } from 'bber-utils'

const writeOutput = true
const cwd = process.cwd()

let settings
let parser

const fileName = () => new Date().toISOString().replace(/:/g, '-')

const styles = {
    pdf__header: `
        font-family: serif;
        text-align: center;
    `,
    pdf__footer: `
        font-family: serif;
        text-align: center;
    `,
}

const initialize = () => {
    parser = new Printer(dist())
    settings = {
        fname: `${fileName()}.pdf`,
        options: {
            height: '279mm', // 8.5"
            width: '215.9mm', // 11"
            orientation: 'portrait',
            border: {
                left: '14mm',
                top: '14mm',
                bottom: '20mm',
                right: '14mm',
            },
            header: {
                height: '7mm',
                contents: `<div style="${styles.pdf__header}"></div>`,
            },
            footer: {
                height: '7mm',
                contents: {
                    first: '',
                    // 2: 'Second page',
                    default: `<div style="${styles.pdf__footer}">{{page}}</div>`,
                    // last: 'Last Page'
                },
            },
            base: `file://${dist()}${path.sep}OPS${path.sep}text${path.sep}`,
            timeout: 10000,
        },
    }

    return Promise.resolve()
}

const write = (content) => {
    if (writeOutput !== true) { return Promise.resolve(content) }
    return new Promise(resolve =>
        fs.writeFile(path.join(dist(), 'pdf.xhtml'), content, (err) => {
            if (err) { throw err }
            resolve(content)
        })
    )
}

const print = content =>
    new Promise((resolve) => {
        log.info(`Creating PDF: ${settings.fname}`)
        html2pdf
            .create(content, settings.options)
            .toFile(path.join(cwd, settings.fname), (err) => {
                if (err) { throw err }
                resolve()
            })
    })

const removeOldPDFBuilds = () =>
    new Promise((resolve, reject) => {
        const promises = []
        const pdfs = fs.readdirSync(cwd).filter(a => path.extname(a) === '.pdf')
        if (!pdfs.length) { return resolve() }
        pdfs.forEach(a => {
            log.info(`Removing PDF [${a}]`)
            promises.push(fs.remove(path.join(cwd, a)))
        })
        Promise.all(promises).catch(err => reject(err)).then(resolve)
    })


    // fs.remove
    // 2017-11-15T14-23-58.911Z.pdf

const pdf = () =>
    new Promise((resolve) => {
        // TODO: pass `writeOutput` flag to determine if the task also outputs
        // XHTML version

        const manifest = store.spine.filter(a => a.linear !== false).map(a => a.fileName)

        initialize()
            .then(_ => removeOldPDFBuilds())
            .then(_ => parseHTMLFiles(manifest, parser, dist()))
            .then(content => write(content))
            .then(content => print(content))
            .catch(err => log.error(err))
            .then(resolve)
    })

export default pdf
