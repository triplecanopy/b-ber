import File from 'vinyl'

class Pkg {
    static body() {
        return new File({
            path: 'pkg.body.tmpl',
            contents: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
                <package
                    version="3.0"
                    xml:lang="en"
                    unique-identifier="uuid"
                    xmlns="http://www.idpf.org/2007/opf"
                    xmlns:dc="http://purl.org/dc/elements/1.1/"
                    xmlns:dcterms="http://purl.org/dc/terms/"
                    prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/"
                >
                    {% body %}
                </package>
            `),
        })
    }
}

export default Pkg
