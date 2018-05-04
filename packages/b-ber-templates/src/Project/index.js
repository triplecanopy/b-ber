import path from 'path'
import crypto from 'crypto'
import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'

class Project {
    static directories(src) {
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
    static configYAML(src) {
        return {
            relativePath: path.join(path.dirname(src), 'config.yml'),
            content: YamlAdaptor.dump(state.config),
        }
    }
    static typeYAML(src, type) {
        return {
            relativePath: path.join(src, `${type}.yml`),
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
- project-name_colophon
`,
        }
    }
    static metadataYAML(src) {
        return {
            relativePath: path.join(src, 'metadata.yml'),
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
    value: ${crypto.randomBytes(20).toString('hex')}
`,
        }
    }
    static javascripts(src) {
        return [{
            relativePath: `${src}/_javascripts/application.js`,
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

window.addEventListener('load', main, false);
`,
        }]
    }
    static markdown(src) {
        return [{
            relativePath: `${src}/_markdown/project-name_title-page.md`,
            content: `---
title: Project Name Title Page
type: titlepage
---

::: titlepage:project-name_title-page  title:"Project Name Title Page"

# Project Title by Author

::: exit:project-name_title-page
`,
        }, {
            relativePath: `${src}/_markdown/project-name-chapter-01.md`,
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
            relativePath: `${src}/_markdown/project-name_colophon.md`,
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

*Project Title* is a DRM-free ebook that uses [b-ber](https://github.com/triplecanopy/b-ber), software designed and developed by [Triple Canopy](https://canopycanopycanopy.com).

::: exit:project-name_colophon
`,
        }]
    }
    static stylesheets() {
        return []
    }
    static readme(src, cwd) {
        return {
            relativePath: `${path.dirname(src)}${path.sep}README.md`,
            content: `
# ${path.basename(cwd)}

Created with [b-ber](https://github.com/triplecanopy/b-ber/)
`,
        }
    }
    static gitignore(src) {
        return {
            relativePath: `${path.dirname(src)}${path.sep}.gitignore`,
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
}

export default Project
