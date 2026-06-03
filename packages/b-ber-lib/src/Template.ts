import renderLayouts from 'layouts'
import File from 'vinyl'

class Template {
  static render = (contents: string, template: string): string =>
    renderLayouts(
      new File({
        path: '.Template',
        layout: 'template',
        contents: Buffer.from(contents),
      }),
      { template }
    ).contents!.toString()
}

export default Template
