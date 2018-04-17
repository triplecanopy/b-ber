# `b-ber-grammar`

`bber-grammar/syntax` contains Markdown renderers for `b-ber`'s output.

`bber-grammar/parsers` contains parsers for `b-ber` "directives". A `b-ber` directive is a Markdown syntax extension which is used to render custom HTML. 

The HTML that `b-ber` outputs when it encounters a directive has been defined in `b-ber`'s core. Directives can be used to render figures, audio, video, named section elements, iframes, and other elements. Directives also support many HTML attributes such as classes, inline-styles, and data-attributes.

`b-ber` directives can be used out-of-the-box, and will output valid XHTML elements. Used with `b-ber-themes`, a rich, styled document can be created with minmal effort.

A complete list of directives and their supported attributes can be found [here](https://github.com/triplecanopy/b-ber/wiki/all-directives).


## Syntax

`b-ber` directives begin three consecutive colons, must include an `id` attribute, and may include other optional or required attributes. See the (reduced) example for the `figure` directive below.

**Input**

```md
<!-- chapter-one.md -->
# Chapter One

::: figure:figure-one source:"./images/my-image.jpg" alt:"My Image"
```

**Output**
```html
<h1>Chapter One</h1>
<figure id="figure-one">
    <img src="my-image.jpg" alt="My Image" />
</figure>
```

Typically `b-ber` directives will output much more verbose HTML, and will create pagination for linking back and forth between footnotes, for example.

## Parsers

`b-ber` uses [`markdown-it`](https://github.com/markdown-it/markdown-it) parser to render Markdown. `markdown-it` supports [adding plugins](https://github.com/markdown-it/markdown-it#plugins-load), many of which are available on `npm`.


## Plugins

Plugins for the `markdown-it` parser are used to extend the [CommonMark](http://commonmark.org/) syntax.

`b-ber` uses the following `markdown-it` plugins available on `npm`

- [`markdown-it-front-matter`](https://www.npmjs.com/package/markdown-it-front-matter)
- [`markdown-it-container`](https://www.npmjs.com/package/markdown-it-container)
- [`markdown-it-footnote`](https://github.com//markdown-it/markdown-it-footnote)

The `markdown-it-container` and `markdown-it-footnote` plugins have been modified to provide consistent syntax when authoring Markdown documents.

### `markdown-it-container`

The `markdown-it-container` plugin provides an interface to manipulate output HTML. It's used to create all custom `block` elements. Below is the default behaviour.

```
::: warning
*here be dragons*
:::
```

**Yields**

```html
<div class="warning">
  <em>here be dragons</em>
</div>
```

`b-ber` extends the `markdown-it-container` to allow for various container types and custom attributes.

```
::: chapter:chapter-one title:"Chapter One"
*here be dragons*
::: exit:chapter-one
```

**Yields**

```html
<section id="chapter-one" title="Chapter One" class="bodymatter chapter" epub:type="bodymatter chapter">
  <em>here be dragons</em>
</section>
```

The basic implementation for creating a custom container is below.

```js
import plugin from '../parsers/section'
import renderer from './factory/block'

const render = ({context}) => (tokens, idx) => {
  if (tokens[idx].nesting === 1) {  // container open
    return '<section>'
  } else {                          // container close
    return '</section>'
  }
}

export default {
  plugin,
  name: 'section',
  renderer: refs =>
    renderer(render(refs))(
      refs,
      /section:[a-zA-Z0-9_-]+/,
      /exit:[a-zA-Z0-9_-]+/
    ),
}
```

Plugins are then registered with the `markdown-it` instance with the following pattern.

```js
import extension from './syntax/section'

this.md = new MarkdownIt()
this.md.use(
  extension.plugin,
  extension.name,
  extension.renderer({context: this})
)
```

See [`b-ber-grammar/syntax/section.js`](https://github.com/triplecanopy/b-ber/blob/master/packages/b-ber-grammar/src/syntax/section.js) and [`b-ber-grammar/index.js`](https://github.com/triplecanopy/b-ber/blob/master/packages/b-ber-grammar/src/index.js) for actual implementation.

### Plugin Rules

Plugins can be divided into `block` and `inline` categories. To maintain consistent syntax, all `block` element plugins should close their containers with the appropiate `id` attribute.

```html
<!-- chapter-one.md -->

<!-- open `chapter` container with the `id` of `one` -->
::: chapter:one

<!-- open `chapter` container with the `id` of `one-point-one` -->
::: chapter:one-point-one

<!-- close chapter `one-point-one` -->
::: exit:one-point-one

<!-- close chapter `one` -->
::: exit:one
```

`inline` elements are self-closing

```html
<!-- chapter-one.md -->

::: figure:one source:my-image.jpg
```

### Authoring Plugins

See the `markdown-it` [API documentation](https://markdown-it.github.io/markdown-it/) and [development info](https://github.com/markdown-it/markdown-it/tree/master/docs) for details about authoring plugins.

### Roadmap

`b-ber` will support user defined MarkdownIt extensions in the future.
