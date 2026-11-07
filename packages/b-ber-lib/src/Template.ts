import renderLayouts from 'layouts'
import File from 'vinyl'

class Template {
  // `template` is a layout for the `layouts` package, which reads its
  // `contents` as a buffer: the vinyl files b-ber-templates returns.
  static render = (contents: string, template: File): string =>
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
