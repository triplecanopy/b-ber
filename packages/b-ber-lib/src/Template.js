import File from 'vinyl'
import renderLayouts from 'layouts'

class Template {
    static render = (contents, template) =>
        renderLayouts(
            new File({
                path: '.Template',
                layout: 'template',
                contents: Buffer.from(contents),
            }),
            { template },
        ).contents.toString()
}

export default Template
