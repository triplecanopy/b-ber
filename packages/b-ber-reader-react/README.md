# `@canopycanopycanopy/b-ber-reader-react`

The `b-ber-reader-react` package contains the source code for the `b-ber-reader` package.

## Install

```
$ npm i -g @canopycanopycanopy/b-ber-reader-react
```

## Develop

Serve the app in the **dev** directory.

Rename **index.example.js** **index.js**, update the `Reader` props with a valid `bookURL` or `manifestURL`, and run

```
npm serve
```

The `serve` script will run a Webpack dev server and inject updates when changes are made in the **src** directory.

## Customize

Extend the **config.development.js** and **config.production.js** files in the **webpack** directory.

Pass in the custom configuration file as an argument to the **package.json** scripts, e.g.,

```
npm watch webpack/config.custom.js
npm build webpack/config.custom.js
```

See **config.custom-example.js** for example implementation.
