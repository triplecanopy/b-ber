import path from 'path'
import {exec} from 'child_process'
import exists from 'command-exists'
import log from '@canopycanopycanopy/b-ber-logger'

const command = 'ebook-convert'

const defaults = {
    inputPath: null,
    outputPath: null,
    fileType: null, // any format supported by `ebook-convert`
    flags: [],
}


function checkForCalibre() {
    return new Promise((resolve, reject) => {
        exists(command, (err, ok) => {
            if (err || !ok) {
                reject(new Error('Error: calibre\'s ebook-convert must be installed. Download calibre here: https://calibre-ebook.com/'))
            }
            resolve()
        })
    })
}


function convertDocument({inputPath, bookPath, flags}) {
    return new Promise((resolve, reject) => {
        exec(`${command} ${inputPath} ${bookPath} ${flags.join(' ')}`,
            {cwd: path.dirname(inputPath)},
            (err, stdout, stderr) => {
                if (err) reject(err)
                if (stderr !== '') reject(new Error(stderr))
                if (stdout !== '') log.info(stdout)
                resolve()
            })
    })
}

function convert(options) {
    const props = ['inputPath', 'outputPath', 'fileType']
    props.forEach(prop => {
        if (!{}.hasOwnProperty.call(options, prop)) {
            throw new Error(`Missing required option [${prop}]`)
        }
    })

    const settings = {...defaults, ...options}
    const modified = new Date().toISOString().replace(/:/g, '-')
    const bookName = `${modified}.${settings.fileType.replace(/^\./, '')}`

    settings.bookPath = `"${path.resolve(settings.outputPath, bookName)}"`

    return new Promise((resolve, reject) =>
        checkForCalibre()
        .then(() => convertDocument(settings))
        .catch(reject)
        .then(resolve)
    )
}



export default {convert}
