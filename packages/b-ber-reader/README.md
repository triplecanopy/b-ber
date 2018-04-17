# b-ber-reader

`b-ber-reader` is a web-based Epub reader. It can be run from inside `b-ber` projects or as a standalone React application. Instructions for installing and running both are below.


## Install

### In `b-ber` Projects

No setup is required.


### As a Standalone App

0. Install [`yarn`](https://yarnpkg.com/lang/en/docs/install/)

1. Clone the repository and install dependencies

```
$ yarn
```

2. Add an `epub` directory to the repo's root directory with some Epubs.

3. Add a `books.json` to the repo's root. Each entry must have a `title`, `url`, and `cover` property.

```json
[{
    "title": "My Great Book",
    "url": "http://localhost:3000/epub/my-great-book/",
    "cover": "http://localhost:3000/epub/my-great-book/OPS/images/cover.jpg"
}]
```

## Develop

**Protip**  
Add a `.localconfig` file in the `b-ber-reader` project directory to enable debug

```js
// .localconfig
module.exports = {debug: true}
```

### Using `b-ber`

Watch for changes from the `b-ber` repo's root with

```console
$ lerna run watch --scope=@canopycanopycanopy/b-ber-reader
```

### Standalone

Watch for changes in the `src` directory and start a server at `http://localhost:3000/` with

```
$ yarn start
```

## Authoring

### `b-ber`

Open a development server and preview contents with

```console
$ bber serve --reader
```

`b-ber` will watch for changes in the `_markdown` directory and rebuild the book when a change occurs.


### Standalone

1. Start a Webpack development server 

```console
$ yarn watch
``` 

2. Edit the XHTML files in the `epub` directory.

## Build

### `b-ber`

Ensure that you've set the `remote_url` in the your project's `config.yml` to the domain where the project will be hosted

```yaml
remote_url: http://example.com
```

In your `b-ber` project, run

```console
$ bber build --reader
```

This will create a web-optimized application in a new `project-reader` directory. 


### Standalone

If deploying remotely, ensure that the book's urls in the `books.json` point to a valid urls where the application will be hosted and not `localhost`.

```
$ yarn build
```

## Test

Run tests with [`jest`](https://facebook.github.io/jest/), either from the `b-ber` repo ...

```console
$ lerna run test --scope=@canopycanopycanopy/b-ber-reader
```

Or in the `b-ber-reader` directory

```console
$ yarn test
```

