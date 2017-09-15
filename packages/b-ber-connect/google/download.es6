
// this is called from sync.es6
//
// ./node_modules/.bin/babel-node ./src/bber-connect/google/download.es6
//
//
// current `config.yml` requires the following:
//
// assets:
//   markdown: api test@google

import fs from 'fs-extra'
import path from 'path'
import stripBomStream from 'strip-bom-stream'
import { remove, filter } from 'lodash'
// import toMarkdown from 'to-markdown'
import sanitizeFileName from 'sanitize-filename'

import {
    // prefixedAsset,
    transformWithMiddleware,
} from './helpers'

import Connect from '../connect'
import Batch from './batch'

const batch = new Batch({ maxCalls: 10, timeRange: 1000 })

const MIMETYPE_DRIVE_FOLDER = 'application/vnd.google-apps.folder'
const MIMETYPE_DRIVE_FILE = 'application/vnd.google-apps.document'

const TMP_DIRNAME = sanitizeFileName(String(new Date().toISOString()))
// const CLEAN_WHEN_FINISHED = false // remove tmp dir when process completes
// we can output html from google drive to preserve asset urls (like images) which
// get lost when using `text/plain`
const REQUEST_MIMETYPE = 'text/plain'
// const RESPONSE_FILE_EXTENSION = '.txt'
// const REQUEST_MIMETYPE = 'text/html'

const connect = new Connect({ client: 'google' })


let drive
let auth


// get the folder based on folder name or id
function rootFolderContents(args, done) {
    console.log('-- getting root dir')
    const { location } = args
    drive.files.list({ auth, q: `name = '${location}' or '${location}' in parents` }, done)
}

function childFolderContents(driveFolder, done) {
    console.log('-- getting sub folder contents')
    const { id } = driveFolder
    return drive.files.list({ auth, q: `'${id}' in parents` }, (err, resp) => {
        if (err) { throw err }
        const driveFiles = filter(resp.files, { mimeType: MIMETYPE_DRIVE_FILE })
        done(err, driveFiles)
    })
}

function parentFolderContents(resp, done) {
    const { files } = resp
    const driveFiles = filter(files, { mimeType: MIMETYPE_DRIVE_FILE })
    const driveFolders = filter(files, { mimeType: MIMETYPE_DRIVE_FOLDER })

    driveFolders.forEach((driveFolder) => {
        batch.add(childFolderContents, driveFolder, (err, data) => {
            done(err, [...driveFiles, ...data])
        })
    })
    batch.processQueue()
}

function exportFile(file, done) {
    console.log('-- downloading %s', file.name)
    const { id, name } = file
    const tmpFile = path.join(__dirname, '.drive', TMP_DIRNAME, name)
    const dest = fs.createWriteStream(tmpFile)

    const request = drive.files.export({ auth, fileId: id, mimeType: REQUEST_MIMETYPE })
        .pipe(stripBomStream())
        .pipe(dest)

    request.on('finish', () => {
        const fpath = path.join(path.dirname(tmpFile), name)
        // pass `content` to user-defined middleware in case further any
        // intermediate transforms need to take place. default is a simple pass-
        // through
        const content = transformWithMiddleware(fs.readFileSync(tmpFile, 'utf8')/*, contentType */)

        fs.writeFile(fpath, content, (err) => {
            done(err, file)
        })
    })

    request.on('error', done)
}


function batchExportFiles(files, done) {
    const results = []
    files.forEach(file =>
        batch.add(exportFile, file, (err, data) => {
            if (err) { throw err }
            results.push(data)
        })
    )
    batch.processQueue()
    batch.once('end', (err) => {
        done(err, results)
    })
}


function ensureTmpDir(done) {
    console.log('-- creating temp dir')
    fs.mkdirp(path.join(__dirname, '.drive', TMP_DIRNAME), done)
}

function download(assets) {
    return new Promise(resolve =>
        connect.exec(() => {
            drive = connect.drive
            auth = connect.oauth2Client

            const rootData = remove(assets, { asset: 'root' }) // mutates
            if (!rootData) { throw new Error('Root directory must be specified in [config.yml]') }

            ensureTmpDir((err0) => {
                if (err0) { throw err0 }
                return rootFolderContents({ ...rootData[0] }, (err1, data0) => {
                    if (err1) { throw err1 }
                    return parentFolderContents(data0, (err2, data1) => {
                        if (err2) { throw err2 }
                        return batchExportFiles(data1, (err3, data2) => {
                            if (err3) { throw err3 }
                            // console.log()
                            // console.log('-- done', err3, data2)
                            return resolve(data2)
                        })
                    })
                })
            })
        })
    )
}


export default download
