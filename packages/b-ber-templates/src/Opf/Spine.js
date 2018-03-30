import path from 'path'
import File from 'vinyl'
import state from '@canopycanopycanopy/b-ber-lib/State'
import {fileId} from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'

class Spine {
    static body() {
        return new File({
            path: 'spine.body.tmpl',
            contents: new Buffer('<spine toc="_toc_ncx">{% body %}</spine>'),
        })
    }
    static item({fname, linear}) {
        return `<itemref idref="${fname}_xhtml" linear="${linear}"/>`
    }
    static items(data) {
        return data.map(a => {
            const nonLinear = a.linear === false
            const linear = nonLinear ? 'no' : 'yes'
            const fname = fileId(path.basename(a.fileName, a.extname))

            if (nonLinear) log.info(`templates/spine writing non-linear asset [${a.fileName}]`)

            if (fname.match(/figure/)) { // TODO: this should be handled more transparently, rn it feels a bit like a side-effect

                log.info('templates/spine writing [loi]')

                if (state.loi.length) {
                    let loi = `<itemref idref="${fname}_xhtml" linear="${linear}"/>`
                    state.loi.forEach(figure => loi += `<itemref idref="${fileId(figure.fileName)}" linear="yes"/>`)
                    return loi
                }
            }


            return Spine.item({fname, linear})
        }).join('')
    }
}

export default Spine
