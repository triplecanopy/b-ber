import File from 'vinyl'
import renderLayouts from 'layouts'

class Template {
    static render(layout, contents, tmpl) {
        return renderLayouts(new File({
            path: '.tmp',
            layout,
            contents: new Buffer(contents),
        }), {[layout]: tmpl}).contents.toString()
    }
}

export default Template
