import path from 'path'
import File from 'vinyl'
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

            if (nonLinear) log.info(`Writing non-linear asset [${a.fileName}] to [spine]`)

            if (fname.match(/figure/)) { // TODO: this should be handled more transparently, rn it feels a bit like a side-effect

                log.info('Writing [LOI] to [spine]')

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
