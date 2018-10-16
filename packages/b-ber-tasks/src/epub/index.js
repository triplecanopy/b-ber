/**
 * @module epub
 */

import zipper from "epub-zipper"
import log from "@canopycanopycanopy/b-ber-logger"
import state from "@canopycanopycanopy/b-ber-lib/State"
import { getBookMetadata } from "@canopycanopycanopy/b-ber-lib/utils"

const epub = () =>
    zipper
        .create({
            input: state.dist,
            output: process.cwd(),
            clean: true,
            fileName: getBookMetadata("identifier", state),
        })
        .catch(log.error)

export default epub
