/**
 * @module render
 */

import Promise from 'zousan'
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import MarkdownRenderer from 'bber-plugins/markdown'
import { pageHead, pageBody, pageTail } from 'bber-templates/pages'
import { src, dist } from 'bber-utils'
import log from 'b-ber-logger'
import store from 'bber-lib/store'
import { findIndex } from 'lodash'


const promises = []

const writeMarkupToFile = (fname, markup) =>
    new Promise((resolve) => {

        const outputPath = path.join(dist(), 'OPS', 'text', `${fname}.xhtml`)

        return fs.writeFile(outputPath, markup, (err) => {
            if (err) { throw err }

            log.info(`Wrote XHTML [${path.basename(fname)}.xhtml]`)
            resolve()

        })
    })



// convert md to xhtml and wrap with page template
const createPageLayout = (fileName, data) =>
    new Promise((resolve) => {

        const textDir = path.join(dist(), 'OPS', 'text')
        const head    = pageHead()
        const body    = MarkdownRenderer.render(fileName, data)
        const tail    = pageTail()

        const markup = renderLayouts(new File({
            path: '.tmp',
            layout: 'pageBody',
            contents: new Buffer(`${head}${body}${tail}`),
        }), { pageBody }).contents.toString()

        try {
            if (!fs.existsSync(textDir)) {
                fs.mkdirSync(textDir)
            }
        } catch (err) {
            // noop
        }

        return writeMarkupToFile(fileName, markup).then(resolve)

    })


const createXTHMLFile = (fpath) =>
    new Promise(resolve =>
        fs.readFile(fpath, 'utf8', (err, data) => {
            if (err) { throw err }
            const fname = path.basename(fpath, '.md')
            return createPageLayout(fname, data).then(resolve)
        })
    )

function render() {
    const mdDir = path.join(src(), '_markdown')

    return new Promise(resolve =>

        fs.readdir(mdDir, (err, _files) => {
            if (err) { throw err }

            const reference = store.spine
            const files = _files.filter(_ => _.charAt(0) !== '.')

            // sort the files in the order that they appear in `type.yml`, so that
            // we process them (and the images they contain) in the correct order
            files.sort((a, b) => {
                const filenameA = path.basename(a, '.md')
                const filenameB = path.basename(b, '.md')
                const indexA    = findIndex(reference, { fileName: filenameA })
                const indexB    = findIndex(reference, { fileName: filenameB })

                return indexA < indexB ? -1 : indexA > indexB ? 1 : 0
            })


            return files.forEach((file) => {

                log.info(`Rendering Markdown [${path.basename(file)}]`)

                promises.push(createXTHMLFile(path.join(mdDir, file)))

                Promise.all(promises)
                .catch(err => log.error(err))
                .then(resolve)

            })
        })
    )
}

export default render
