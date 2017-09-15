# `b-ber-templates`

_**TK: add examples for strings below**_

This directory contains all the XML and HTML templates used when writing output. Templates are typically created by passing in a `vinyl` File object to the [`layouts`](https://www.npmjs.com/package/layouts) package.

```js
// demo-template.js
const demo = new File({
  path: 'demo.tmpl',
  contents: new Buffer(`
    <html>
      <body>
        {% body %}
      </body>
    </html>`
  )
})

export { demo }
```

```js
// demo-layout.js
import layouts from 'layouts'
import { demo } from './demo-template'

const html = layouts(
  new File({
    path: './.tmp',
    layout: 'demo',
    contents: new Buffer('Here is some content')
  }),
  { demo }
)
.contents
.toString()

fs.writeFile('./demo.html', html, (err) => {
  if (err) { throw err }
  //...
})
```

**Output**

```html
<html>
  <body>
    Here is some content
  </body>
</html>
```

In some cases, templates are simple functions that return strings.

```js
// figure-demo.js
function figure(data) {
  return `
    <figure id="${data.id}">
      <img src="${data.src}" alt="${data.alt}" />
    </figure>`
}

export default figure
```

```js
// render-demo.js
import figure from './figure-demo'

function render() {
  const imageData = {
    id: 1,
    src: './image/my-image.jpg',
    alt: 'My Image',
  }
  const html = figure(imageData)
  fs.writeFile('./figure.html', html, (err) => {
    if (err) { throw err }
    //...
  })
}
```
