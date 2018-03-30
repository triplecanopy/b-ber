/**
 * @module render
 */


import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import renderLayouts from 'layouts'
import {findIndex} from 'lodash'
import MarkdownRenderer from '@canopycanopycanopy/b-ber-grammar'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'


const promises = []

const writeMarkupToFile = (fname, markup) =>
    new Promise(resolve => {

        const outputPath = path.join(state.dist, 'OPS', 'text', `${fname}.xhtml`)

        return fs.writeFile(outputPath, markup, err => {
            if (err) throw err

            log.info(`render xhtml [${path.basename(fname)}.xhtml]`)
            resolve()

        })
    })



// convert md to xhtml and wrap with page template
const createPageLayout = (fileName, data) =>
    new Promise(resolve => {

        const textDir = path.join(state.dist, 'OPS', 'text')
        const head    = Xhtml.head()
        const body    = MarkdownRenderer.render(fileName, data)
        const tail    = Xhtml.tail()

        const markup = renderLayouts(new File({
            path: '.tmp',
            layout: 'body',
            contents: new Buffer(`${head}${body}${tail}`),
        }), {body: Xhtml.body()}).contents.toString()

        try {
            if (!fs.existsSync(textDir)) {
                fs.mkdirSync(textDir)
            }
        } catch (err) {
            // noop
        }

        return writeMarkupToFile(fileName, markup).then(resolve)

    })


const createXTHMLFile = fpath =>
    new Promise(resolve =>
        fs.readFile(fpath, 'utf8', (err, data) => {
            if (err) throw err
            const fname = path.basename(fpath, '.md')
            return createPageLayout(fname, data).then(resolve)
        })
    )

function render() {
    const mdDir = path.join(state.src, '_markdown')

    return new Promise(resolve =>

        fs.readdir(mdDir, (err, _files) => {
            if (err) throw err

            const reference = state.spine
            const files = _files.filter(_ => _.charAt(0) !== '.')

            // sort the files in the order that they appear in `type.yml`, so that
            // we process them (and the images they contain) in the correct order
            files.sort((a, b) => {
                const filenameA = path.basename(a, '.md')
                const filenameB = path.basename(b, '.md')
                const indexA    = findIndex(reference, {fileName: filenameA})
                const indexB    = findIndex(reference, {fileName: filenameB})

                return indexA < indexB ? -1 : indexA > indexB ? 1 : 0
            })


            return files.forEach(file => {

                log.info(`render markdown [${path.basename(file)}]`)

                promises.push(createXTHMLFile(path.join(mdDir, file)))

                Promise.all(promises)
                    .catch(err => log.error(err))
                    .then(resolve)

            })
        })
    )
}

export default render
