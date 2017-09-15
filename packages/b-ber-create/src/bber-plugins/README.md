# `bber-plugins`

_**TK: mention the markdown-it parser, bber directives, inject tasks, customizing phantomjs PDF output? better to reference here maybe than in bber-modifiers**_

_**TK: mention logging, logging verbosity here too**_

`bber-plugins/` contains both custom and pre-fab extensions to `b-ber`.

- `bber-plugins/md/` exports custom `b-ber` directives. `b-ber` directives add custom syntax to the Markdown parser, which allows expressive output through a minimal interface. Read more about custom directives and the Markdown parser [here](https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-plugins/md).
- `bber-plugins/log/` exports a wrapper around the [`bunyan`](https://www.npmjs.com/package/bunyan) package, which `b-ber` uses for console messages.
- `bber-plugins/editor/` launches the `b-ber` editor, a fork of the browser-based Markdown editor [Dillinger](https://github.com/joemccann/dillinger) (*Not yet implemented*)
