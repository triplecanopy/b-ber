/**
 * @module loi
 */

import fs from 'fs-extra'
import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import {modelFromString} from '@canopycanopycanopy/b-ber-lib/utils'
import figure from '@canopycanopycanopy/b-ber-templates/figures'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'

const createLOILeader = () =>
    new Promise(resolve => {

        const filename = 'figures-titlepage'
        const markup = renderLayouts(new File({
            path: '.tmp',
            layout: 'document',
            contents: new Buffer(Xhtml.loi()),
        }), {document: Xhtml.document()}).contents.toString()


        fs.writeFile(path.join(state.dist, 'OPS', 'text', `${filename}.xhtml`), markup, 'utf8', err => {
            if (err) throw err

            state.add('guide', {
                filename,
                title: 'Figures',
                type: 'loi',
            })

            log.info(`Created default Figures titlepage [${filename}.xhtml]`)

            resolve()
        })
    })

const createLOI = () =>
    new Promise(resolve => {

        state.figures.forEach((data, idx) => {

            // Create image string based on dimensions of image
            // returns square | landscape | portrait | portraitLong
            const figureStr = figure(data, state.build)
            const markup = renderLayouts(new File({
                path: '.tmp',
                layout: 'document',
                contents: new Buffer(figureStr),
            }), {document: Xhtml.document()}).contents.toString()


            fs.writeFile(path.join(state.dist, 'OPS', 'text', data.page), markup, 'utf8', err => {
                if (err) throw err

                const fileData = {
                    ...modelFromString(data.page, state.config.src),
                    in_toc: false,
                    ref: data.ref,
                    pageOrder: data.pageOrder,
                }

                state.add('loi', fileData)

                log.info(`loi linking [${data.source}] to [${data.page}]`)

                if (idx === state.figures.length - 1) {
                    // make sure we've added figures to the spine in the correct order
                    state.loi.sort((a, b) => a.pageOrder < b.pageOrder ? -1 : a.pageOrder > b.pageOrder ? 1 : 0)
                    resolve()
                }

            })
        })
    })

const loi = () =>
    new Promise(async resolve => {
        if (state.figures.length) {
            createLOILeader()
                .then(createLOI)
                .catch(err => log.error(err))
                .then(resolve)
        } else {
            resolve()
        }
    })

export default loi
