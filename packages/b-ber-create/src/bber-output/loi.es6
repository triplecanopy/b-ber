/**
 * @module loi
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import store from 'bber-lib/store'
import { log } from 'bber-plugins'
import { dist, build, modelFromString } from 'bber-utils'
import figure from 'bber-templates/figures'
import { page, loiLeader } from 'bber-templates/pages'

const createLOILeader = () =>
    new Promise((resolve) => {

        const filename = 'figures-titlepage'
        const markup = renderLayouts(new File({
            path: './.tmp',
            layout: 'page',
            contents: new Buffer(loiLeader()),
        }), { page }).contents.toString()


        fs.writeFile(path.join(dist(), `/OPS/text/${filename}.xhtml`), markup, 'utf8', (err) => {
            if (err) { throw err }
            // TODO: following be merged with `store.spine`, and `store.pages`
            // should be removed
            store.add('pages', {
                filename,
                title: 'Figures',
                type: 'loi',
            })

            log.info(`bber-output/loi: Created default Figures titlepage [${filename}.xhtml]`)

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
                path: './.tmp',
                layout: 'page',
                contents: new Buffer(figureStr),
            }), { page }).contents.toString()


            fs.writeFile(path.join(dist(), '/OPS/text', data.page), markup, 'utf8', (err) => {
                if (err) { throw err }

                const fileData = {
                    ...modelFromString(data.page, store.config.src),
                    in_toc: false,
                    ref: data.ref,
                    pageOrder: data.pageOrder,
                }

                store.add('loi', fileData)

                log.info(`bber-output/loi: Created linked figure page from image found in source [${data.page}]`)
                log.info(`bber-output/loi: ${data.source} -> ${data.page}`)

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
