/* eslint-disable max-len */
import path from 'path'
import fs from 'fs-extra'
import { guid } from 'bber-utils'
import store from 'bber-lib/store'
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
        `${src}/_media`,
        `${src}/.tmp`,
    ]
}

function config(src, dist) {
    return {
        relpath: path.join(path.dirname(src), 'config.yml'),
        content: `env: development # development | production
theme: b-ber-theme-serif # name or path
src: ${path.basename(src)}
dist: ${path.basename(dist)}`,
    }
}

function typeYaml(src, type) {
    return {
        relpath: path.join(src, `${type}.yml`),
        content: `# Table of Contents
# "in_toc:false" removes the Table of Contents from the built-in navigation of the reader.
# "linear:false" removes the Table of Contents from the project's contents.
- toc:
        in_toc: false
        linear: false
# Cover
- cover:
        in_toc: false
# Project Contents
- project-name_title-page
- project-name-chapter-01
- project-name_colophon`,
    }
}

function metadata(src) {
    return {
        relpath: path.join(src, 'metadata.yml'),
        content: `-
    term: title
    value: Sample Project
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
    value: Author Name © 2017
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
    term: identifier
    value: ${guid()}`,
    }
}

function javascripts(src) {
    return [{
        relpath: `${src}/_javascripts/application.js`,
        content: `function clicked(e) {
    window.location.href = this.getAttribute('href');
    return false;
}

function main() {
    // Normalize link behaviour on iBooks, without interfering with footnotes
    var links = document.getElementsByTagName('a')
    links = Array.prototype.slice.call(links, 0);
    links = links.filter(function(l) {
        return l.classList.contains('footnote-ref') === false;
    });

    for (var i = 0; i < links.length; i++) {
        links[i].onclick = clicked;
    }
}

window.addEventListener('load', main, false);`,
    }]
}

function markdown(src) {
    return [{
        relpath: `${src}/_markdown/project-name_title-page.md`,
        content: `---
title: Project Name Title Page
type: titlepage
---

::: titlepage:project-name_title-page  title:"Project Name Title Page"

# Project Title by Author

::: exit:project-name_title-page
`,
    }, {
        relpath: `${src}/_markdown/project-name-chapter-01.md`,
        content: `---
title: Project Name Chapter One
type: bodymatter
---

::: chapter:project-name_chapter-one title:"Project Name Chapter One"

# Chapter Title

Chapter Contents

::: exit:project-name_chapter-one
`,
    }, {
        relpath: `${src}/_markdown/project-name_colophon.md`,
        content: `---
title: Project Name Colophon
type: colophon
---

::: colophon:project-name_colophon title:"Project Name Colophon"

*Project Title* by Author

Published by Publisher, 2017

::: subchapter:credits

© 2016 *Project Title*, by Author. Texts and images copyright the author, unless otherwise stated.

::: exit:credits

::: logo:publishers-logo source:default-publishers-logo.png

Publisher
1234 Street
City, State Zip
Country

::: logo:b-ber-logo source:b-ber-logo.png

*Project Title* is a DRM-free ebook that uses [b-ber](https://github.com/triplecanopy/b-ber-creator), software designed and developed by [Triple Canopy](https://canopycanopycanopy.com).

::: exit:project-name_colophon
`,
    }]
}

function stylesheets(src) {
    return []
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

/project*
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
