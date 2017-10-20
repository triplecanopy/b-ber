
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

const writeOutput = false

let settings
let parser

const fileName = () => new Date().toISOString().replace(/:/g, '-')

const initialize = () => {
    parser = new Printer(dist())
    settings = {
        fname: `${fileName()}.pdf`,
        options: {
            height: '279mm', //8.5"
            width: '215.9mm', //11"
            orientation: 'portrait',
            border: {
                left: '14mm',
                top: '14mm',
                bottom: '20mm',
                right: '14mm',
            },
            header: {
                height: '7mm',
                contents: '<div style="text-align: center; font-family:Helvetica; font-size:12px; color: lightgrey;">Made with bber</div>', // eslint-disable-line max-len
            },
            footer: {
                height: '7mm',
                contents: {
                    //first: 'Cover page',
                    //2: 'Second page',
                    default: '<div style="font-family:Helvetica; font-size:12px; color: lightgrey;"><span>{{page}}</span>/<span>{{pages}}</span></div>',
                    //last: 'Last Page'
                },
            },
            base: `file://${dist()}${path.sep}OPS${path.sep}Text${path.sep}`,
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
        .toFile(path.join(process.cwd(), settings.fname), (err) => {
            if (err) { throw err }
            resolve()
        })
    })

const pdf = () =>
    new Promise((resolve) => {
        const manifest = store.spine.map(n => n.fileName)

        // TODO: pass `writeOutput` flag to determine if the task also outputs
        // XHTML version

        initialize()
        .then(() => parseHTMLFiles(manifest, parser, dist()))
        .then(content => write(content))
        .then(content => print(content))
        .catch(err => log.error(err))
        .then(resolve)
    })

export default pdf
