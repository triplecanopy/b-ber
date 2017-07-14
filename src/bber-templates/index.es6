/* eslint-disable max-len */
import path from 'path'
import fs from 'fs-extra'
import { guid, theme } from 'bber-utils'
import * as figures from 'bber-templates/figures'
import * as pages from 'bber-templates/pages'
import * as opf from 'bber-templates/opf'

const containerXML = `<?xml version="1.0"?>
  <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
      <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
  </container>`

const mimetype = 'application/epub+zip'
const scriptTag = '<script type="application/javascript" src="{% body %}"></script>'
const stylesheetTag = '<link rel="stylesheet" type="text/css" href="{% body %}"/>'
const jsonLDTag = '<script type="application/ld+json">{% body %}</script>'

function sourceDirs(src) {
  return [
    src,
    `${src}/_images`,
    `${src}/_javascripts`,
    `${src}/_stylesheets`,
    `${src}/_markdown`,
    `${src}/_fonts`,
    `${src}/.tmp`,
  ]
}

function config(src, dist) {
  return {
    relpath: path.join(path.dirname(src), 'config.yml'),
    content: `env: development # development | production
theme: default # name or path
src: ${path.basename(src)}
dist: ${path.basename(dist)}`,
  }
}

function typeYaml(src, type) {
  return {
    relpath: path.join(src, `${type}.yml`),
    content: '',
  }
}

function metadata(src) {
  return {
    relpath: path.join(src, 'metadata.yml'),
    content: `-
  term: title
  value: Sample Book
  term_property: title-type
  term_property_value: main
-
  term: creator
  value: Author Name
  term_property: role
  term_property_value: aut
-
  term: contributor
  value: bber
  term_property: role
  term_property_value: ctb
-
  term: language
  value: en-US
-
  term: rights
  value: Sample Book © 2017
-
  term: format
  value: epub+zip
-
  term: date
  value: 2017-01-01
-
  term: publisher
  value: Triple Canopy
-
  term: date-modified
  value: 2017-01-01
-
  term: identifier
  value: ${guid()}`,
  }
}

function javascripts(src) {
  return [{
    relpath: `${src}/_javascripts/application.js`,
    content: `function clicked(e) {
  window.location.href = this.getAttribute('href')
  return false
}

function main() {
  // Normalize link behaviour on iBooks
  var links = document.getElementsByTagName('a');
  for (var i = 0; i < links.length; i++) {
    links[i].onclick = clicked
  }
}

window.onload = main`,
  }]
}

function markdown(src) {
  return [{
    relpath: `${src}/_markdown/00001.md`,
    content: `---
title: Chapter One
type: bodymatter
---
`,
  }]
}

function stylesheets(src) {
  return [{
    relpath: `${src}/_stylesheets/variable-overrides.scss`,
    content: fs.readFileSync(
      path.join(theme().tpath, '_theme-settings.scss')
    , 'utf8').replace(/\s+?!default/g, ''),
  }, {
    relpath: `${src}/_stylesheets/style-overrides.scss`,
    content: `// Styles added here will be appended to the selected theme's
// CSS output. A good place for overrides and custom styles!`,
  }]
}

function readme(src, cwd) {
  return {
    relpath: `${path.dirname(src)}/README.md`,
    content: `# ${path.basename(cwd)}

Created with [b-ber](https://github.com/triplecanopy/b-ber-creator/)
`,
  }
}

function gitignore(src) {
  return {
    relpath: `${path.dirname(src)}/.gitignore`,
    content: `.DS_Store
.tmp

*.map
*.epub
*.mobi
*.pdf

node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
bber-debug.log*
`,
  }
}

function coverSVG({ width, height, href }) {
  return `<div style="text-align: center; padding: 0; margin: 0;">
    <svg xmlns="http://www.w3.org/2000/svg" height="100%" preserveAspectRatio="xMidYMid meet" version="1.1" viewBox="0 0 ${width} ${height}" width="100%" xmlns:xlink="http://www.w3.org/1999/xlink">
      <image width="${width}" height="${height}" xlink:href="../${href}"/>
    </svg></div>`
}


export { containerXML, mimetype, scriptTag, stylesheetTag, pages, figures,
  opf, jsonLDTag, sourceDirs, config, typeYaml, metadata, javascripts,
  stylesheets, markdown, readme, gitignore, coverSVG }
