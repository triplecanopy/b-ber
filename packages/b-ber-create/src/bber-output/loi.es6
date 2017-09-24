/**
 * @module loi
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import store from 'bber-lib/store'
import log from 'b-ber-logger'
import { dist, build, modelFromString } from 'bber-utils'
import figure from 'bber-templates/figures'
import { page, loiLeader } from 'bber-templates/pages'

const createLOILeader = () =>
    new Promise((resolve) => {

        const filename = 'figures-titlepage'
        const markup = renderLayouts(new File({
            path: '.tmp',
            layout: 'page',
            contents: new Buffer(loiLeader()),
        }), { page }).contents.toString()


        fs.writeFile(path.join(dist(), 'OPS', 'text', `${filename}.xhtml`), markup, 'utf8', (err) => {
            if (err) { throw err }

            store.add('guide', {
                filename,
                title: 'Figures',
                type: 'loi',
            })

            log.info(`Created default Figures titlepage [${filename}.xhtml]`)

            resolve()
        })
    })

const createLOI = () =>
    new Promise((resolve) => {

        store.figures.forEach((data, idx) => {

            // Create image string based on dimensions of image
            // returns square | landscape | portrait | portraitLong
            const figureStr = figure(data, build())
            const markup = renderLayouts(new File({
                path: '.tmp',
                layout: 'page',
                contents: new Buffer(figureStr),
            }), { page }).contents.toString()


            fs.writeFile(path.join(dist(), 'OPS', 'text', data.page), markup, 'utf8', (err) => {
                if (err) { throw err }

                const fileData = {
                    ...modelFromString(data.page, store.config.src),
                    in_toc: false,
                    ref: data.ref,
                    pageOrder: data.pageOrder,
                }

                store.add('loi', fileData)

                log.info(`Linking figure [${data.source}] to [${data.page}]`)

                if (idx === store.figures.length - 1) {
                    // make sure we've added figures to the spine in the correct order
                    store.loi.sort((a, b) => a.pageOrder < b.pageOrder ? -1 : a.pageOrder > b.pageOrder ? 1 : 0)
                    resolve()
                }

            })
        })
    })

const loi = () =>
    new Promise(async (resolve) => {
        if (store.figures.length) {
            createLOILeader()
            .then(createLOI)
            .catch(err => log.error(err))
            .then(resolve)
        } else {
            resolve()
        }
    })

export default loi
