import htmlparser from 'htmlparser2'

/**
 * @class HtmlToXml
 */
class HtmlToXml {
    /**
     * [constructor description]
     * @param  {Array} customElements [description]
     * @constructor
     * @constructs HtmlToXml
     */
    constructor(customElements) {
        const defaultElements = [
            'pullquote',
            'epigraph',
            'dialogue',
            'gallery',
            'colophon',
            'appendix',
            'subtitle',
            'frontmatter',
            'backmatter',
            'meta-content',
            'bibliography',
            'masthead',
            'figcaption',
            'subchapter',
        ]
        const elements = customElements && customElements.constructor === Array
            ? [...customElements, ...defaultElements]
            : defaultElements

        this.customElements = elements
        this.whitelistedAttrs = ['src', 'href', 'xlink:href', 'xmlns', 'xmlns:xlink']
        this.blacklistedTags = ['html', 'head', 'title', 'meta', 'link', 'script', 'body']
        this.output = ''
        this.tagnames = []
        this.noop = false


        this.entries = function* entries(obj) {
            // TODO: remove for..of
            for (const key of Object.keys(obj)) { // eslint-disable-line no-restricted-syntax
                yield [key, obj[key]]
            }
        }
    }

    /**
     * [reset description]
     * @return {Object}
     */
    reset() {
        this.output = ''
        this.tagnames = []
        this.noop = false
        return this
    }

    /**
     * [onend description]
     * @param  {Function} resolve [description]
     * @param  {Number} index   [description]
     * @param  {Number} len     [description]
     * @return {Promise<Object|Error>}
     */
    onend(resolve, index, len) {

        if (index === len - 1) {
            this.appendBody()
        } else {
            this.output += '<pagebreak></pagebreak>'
        }
        resolve(this.output)
    }

    /**
     * [appendXMLDeclaration description]
     * @return {HtmlToXml}
     */
    appendXMLDeclaration() {
        this.output += '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        return this
    }

    /**
     * [prependBody description]
     * @return {HtmlToXml}
     */
    prependBody() {
        this.output += '<body>'
        return this
    }

    /**
     * [appendBody description]
     * @return {HtmlToXml}
     */
    appendBody() {
        this.output += '</body>'
        return this
    }

    /**
     * [appendComment description]
     * @param  {String} fname File path
     * @return {HtmlToXml}
     */
    appendComment(fname) {
        this.output += `\n<!-- \n${fname}\n -->\n\n`
        return this
    }

    /**
     * [parse description]
     * @param  {String} content XHTML file contents
     * @param  {Number} index   [description]
     * @param  {Array} arr     [description]
     * @return {Promise<Object|Error>}
     */
    parse(content, index, arr) {
        const _this = this // eslint-disable-line consistent-this
        const len = arr.length
        if (index === 0) _this.appendXMLDeclaration()
        _this.appendComment(arr[index])
        if (index === 0) _this.prependBody()
        return new Promise(resolve => {
            const parser = new htmlparser.Parser({
                onopentag(name, attrs) {
                    _this.noop = false
                    switch (name) {
                        case 'html':
                        case 'head':
                        case 'title':
                        case 'meta':
                        case 'link':
                        case 'script':
                            _this.noop = true
                            break
                        case 'body':
                            if (attrs && attrs.class) {
                                _this.tagnames.push(attrs.class.replace(/\s+/g, '-'))
                            }
                            break
                        case 'div':
                        case 'span':
                        case 'section': {
                            let tagname = name
                            if (attrs && attrs.class) {
                                const klasses = attrs.class.split(' ')
                                for (let i = 0; i < klasses.length; i++) {
                                    if (_this.customElements.indexOf(klasses[i]) > -1) {
                                        tagname = klasses[i]
                                        break
                                    }
                                }
                            }
                            _this.tagnames.push(tagname)
                            break
                        }
                        default:
                            _this.tagnames.push(name)
                            break
                    }


                    if (_this.noop) return
                    const tag = []
                    const tagname = _this.tagnames[_this.tagnames.length - 1]
                    if (tagname && _this.blacklistedTags.indexOf(tagname) < 0) {
                        // TODO: remove for..of
                        for (const [key, val] of _this.entries(attrs)) { // eslint-disable-line no-restricted-syntax
                            if (_this.whitelistedAttrs.indexOf(key) > -1) {
                                tag.push(`${key}="${val}"`)
                            }
                        }
                        tag.unshift(tagname)
                        _this.output += `<${tag.join(' ')}>`
                    }
                },
                ontext(text) {
                    const tagname = _this.tagnames[_this.tagnames.length - 1]
                    if (tagname && _this.blacklistedTags.indexOf(tagname) < 0) {
                        _this.output += text
                    }
                },
                onclosetag() {
                    const tagname = _this.tagnames.pop()
                    if (tagname) _this.output += `</${tagname}>`
                },
                onend() {
                    _this.onend(resolve, index, len)
                },
            }, {decodeEntities: false})

            parser.write(content)
            parser.end()

            _this.reset()
        })
    }
}

export default HtmlToXml