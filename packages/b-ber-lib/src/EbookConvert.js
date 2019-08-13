import path from 'path'
import has from 'lodash/has'
import { exec } from 'child_process'
import exists from 'command-exists'
import log from '@canopycanopycanopy/b-ber-logger'

const command = 'ebook-convert'

const defaults = {
    inputPath: null,
    outputPath: null,
    fileType: null, // any format supported by `ebook-convert`
    fileName: new Date().toISOString().replace(/:/g, '-'),
    flags: [],
}

function checkForCalibre() {
    return new Promise((resolve, reject) => {
        exists(command, (err, ok) => {
            if (err || !ok) {
                return reject(
                    new Error(
                        "Error: calibre's ebook-convert must be installed. Download calibre here: https://calibre-ebook.com/"
                    )
                )
            }
            resolve()
        })
    })
}

function convertDocument({ inputPath, bookPath, flags }) {
    return new Promise((resolve, reject) => {
        exec(
            `${command} ${inputPath} ${bookPath} ${flags.join(' ')}`,
            { cwd: process.cwd() },
            (err, stdout, stderr) => {
                if (err) return reject(err)
                if (stderr !== '') process.stdout.write(stderr)
                if (stdout !== '') process.stdout.write(stdout)
                resolve()
            }
        )
    })
}

function convert(options) {
    const props = ['inputPath', 'outputPath', 'fileType']
    props.forEach(prop => {
        if (!has(options, prop)) {
            throw new Error(`Missing required option [${prop}]`)
        }
    })

    const settings = { ...defaults, ...options }
    const bookName = `${settings.fileName}.${settings.fileType.replace(/^\./, '')}`

    settings.bookPath = `"${path.resolve(settings.outputPath, bookName)}"`

    return checkForCalibre()
        .then(() => convertDocument(settings))
        .catch(log.error)
}

export default { convert }
