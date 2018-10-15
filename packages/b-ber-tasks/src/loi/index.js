/**
 * @module loi
 */

import fs from "fs-extra"
import path from "path"
import state from "@canopycanopycanopy/b-ber-lib/State"
import log from "@canopycanopycanopy/b-ber-logger"
import { SpineItem, Template } from "@canopycanopycanopy/b-ber-lib"
import figure from "@canopycanopycanopy/b-ber-templates/figures"
import Xhtml from "@canopycanopycanopy/b-ber-templates/Xhtml"

const createLOILeader = () => {
    const fileName = "figures-titlepage.xhtml"
    const markup = Template.render("document", Xhtml.loi(), Xhtml.document())

    return fs
        .writeFile(
            path.join(state.dist, "OPS", "text", `${fileName}`),
            markup,
            "utf8"
        )
        .then(() => {
            state.add("guide", {
                filename: fileName,
                title: "Figures",
                type: "loi",
            })
            log.info(`loi emit default figures titlepage [${fileName}]`)
        })
}

const createLOIAsSeparateHTMLFiles = () => {
    const promises = state.figures.map(data => {
        // Create image string based on dimensions of image
        // returns square | landscape | portrait | portraitLong
        const figureStr = figure(data, state.build)
        const markup = Template.render("document", figureStr, Xhtml.document())

        return fs
            .writeFile(
                path.join(state.dist, "OPS", "text", data.page),
                markup,
                "utf8"
            )
            .then(() => {
                const fileData = new SpineItem({
                    fileName: data.page,
                    in_toc: false,
                    ref: data.ref,
                    pageOrder: data.pageOrder,
                })
                state.add("loi", fileData)
                log.info(`loi linking [${data.source}] to [${data.page}]`)
            })
    })

    return Promise.all(promises).then(() =>
        state.loi.sort(
            (a, b) =>
                a.pageOrder < b.pageOrder
                    ? -1
                    : a.pageOrder > b.pageOrder
                        ? 1
                        : 0
        )
    )
}

const createLOIAsSingleHTMLFile = () => {
    let figuresPage = ""
    figuresPage += Xhtml.loi()
    figuresPage += state.figures.reduce(
        (acc, curr) => acc.concat(figure(curr, state.build)),
        ""
    )

    const fileName = "figures-titlepage.xhtml"
    const markup = Template.render("document", figuresPage, Xhtml.document())

    return fs
        .writeFile(
            path.join(state.dist, "OPS", "text", `${fileName}`),
            markup,
            "utf8"
        )
        .then(() => {
            state.add("guide", {
                filename: fileName,
                title: "Figures",
                type: "loi",
            })
            log.info(`loi emit figures titlepage [${fileName}]`)
        })
}

const loi = () => {
    if (!state.figures.length) return Promise.resolve()

    // For certain builds it may be preferable to have all figures on a
    // single page (e.g., during the web or reader builds). We could set
    // a flag for this, but current functionality is to always default
    // to split the figures into separate files *unless* we're building
    // for the reader.

    // This branch concatentates all the figures, as well as the loi-leader
    // (the 'Figures' header text) into a single document
    if (state.build === "reader") { return createLOIAsSingleHTMLFile().catch(log.error) }

    // create separate files
    return createLOILeader()
        .then(createLOIAsSeparateHTMLFiles)
        .catch(log.error)
}

export default loi
