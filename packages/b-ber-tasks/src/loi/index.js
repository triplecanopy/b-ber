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

const createLOILeader = _ => new Promise((resolve, reject) => {

    const fileName = 'figures-titlepage.xhtml'
    const markup = renderLayouts(new File({
        path: '.tmp',
        layout: 'document',
        contents: new Buffer(Xhtml.loi()),
    }), {document: Xhtml.document()}).contents.toString()


    fs.writeFile(path.join(state.dist, 'OPS', 'text', `${fileName}`), markup, 'utf8', err => {
        if (err) return reject(err)

        state.add('guide', {filename: fileName, title: 'Figures', type: 'loi'})

        log.info(`loi emit default figures titlepage [${fileName}]`)

        resolve()
    })
})

const createLOIAsSeparateHTMLFiles = _ => new Promise((resolve, reject) =>
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
            if (err) return reject(err)

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
)


const createLOIAsSingleHTMLFile = _ => new Promise((resolve, reject) => {

    let figuresPage = ''
    figuresPage += Xhtml.loi()
    figuresPage += state.figures.reduce((acc, curr) => acc.concat(figure(curr, state.build)), '')

    const fileName = 'figures-titlepage.xhtml'
    const markup = renderLayouts(new File({
        path: '.tmp',
        layout: 'document',
        contents: new Buffer(figuresPage),
    }), {document: Xhtml.document()}).contents.toString()


    fs.writeFile(path.join(state.dist, 'OPS', 'text', `${fileName}`), markup, 'utf8', err => {
        if (err) return reject(err)

        state.add('guide', {filename: fileName, title: 'Figures', type: 'loi'})

        log.info(`loi emit figures titlepage [${fileName}]`)

        resolve()
    })
})

const loi = _ => new Promise(resolve => {
    if (state.figures.length) {

        // For certain builds it may be preferable to have all figures on a
        // single page (e.g., during the web or reader builds). We could set
        // a flag for this, but current functionality is to always default
        // to split the figures into separate files *unless* we're building
        // for the reader.

        // This branch concatentates all the figures, as well as the loi-leader
        // (the 'Figures' header text) into a single document
        if (state.build === 'reader') {
            return createLOIAsSingleHTMLFile()
                .catch(err => log.error(err))
                .then(resolve)
        }

        // create separate files
        return createLOILeader()
            .then(createLOIAsSeparateHTMLFiles)
            .catch(err => log.error(err))
            .then(resolve)
    }

    return resolve()
})

export default loi
