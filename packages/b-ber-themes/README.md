# `b-ber-themes`

The `b-ber-themes` package contains the default `b-ber` themes (stylesheets) for use with `b-ber` projects. The theme can selected from the command line or written manually into the project's `config.yml`.

Each theme is a collection of SCSS files with a single entry point, `application.scss`, and follow the structure of `npm` packages. A theme must contain a `package.json` file, which must itself contain a valid file name in the `main` property. 

The default `b-ber` themes - `b-ber-theme-serif` and `b-ber-theme-sans` - are bundled in the `b-ber-themes` package, and both include a number of mixins and settings which can be used and overriden at the project level. Multiple themes can be used by a single project, and users can also create and integrate their own themes without altering the application's core.


See the wiki for more information about [using themes](https://github.com/triplecanopy/b-ber/wiki/Themes) and [creating custom themes](https://github.com/triplecanopy/b-ber/wiki/Creating-Custom-Themes) in the wiki.


## Relevant `b-ber` Commands

Show a list of installed themes

```
$ bber theme --list
```

Set the current project's theme

```
$ bber theme --set=my-theme-name
```
