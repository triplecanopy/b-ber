import path from 'path'
import crypto from 'crypto'
import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'

class Project {
    static directories(src) {
        return [
            src,
            path.join(path.dirname(src), 'themes'),
            `${src}/_images`,
            `${src}/_javascripts`,
            `${src}/_stylesheets`,
            `${src}/_markdown`,
            `${src}/_fonts`,
            `${src}/_media`,
            `${src}/.tmp`,
        ]
    }
    static relativePath(src, ...rest) {
        return path.join(path.basename(src), ...rest)
    }
    static absolutePath(src, ...rest) {
        return path.join(path.dirname(src), path.basename(src), ...rest)
    }
    static configYAML(src) {
        return {
            relativePath: Project.relativePath(src, '..', 'config.yml'),
            absolutePath: Project.absolutePath(src, '..', 'config.yml'),
            content: YamlAdaptor.dump(state.config),
        }
    }
    static typeYAML(src, type) {
        return {
            relativePath: Project.relativePath(src, `${type}.yml`),
            absolutePath: Project.absolutePath(src, `${type}.yml`),
            content: `# Table of Contents
# "in_toc:false" removes the entry from the built-in navigation of the reader.
# "linear:false" removes the entry from the project's contents.
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
            relativePath: Project.relativePath(src, 'metadata.yml'),
            absolutePath: Project.absolutePath(src, 'metadata.yml'),
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
        return [
            {
                relativePath: Project.relativePath(
                    src,
                    '_javascripts',
                    'application.js'
                ),
                absolutePath: Project.absolutePath(
                    src,
                    '_javascripts',
                    'application.js'
                ),
                content: `// All user defined functions should be wrapped in a 'domReady' call - or by using a third-party lib like jQuery - for compatibility in reader, web, and e-reader versions.
// Use the global \`window.bber.env\` variable to limit scripts to particular envionments. See example below
//
// Examples:
//  domReady(fn)
//  domReady(function() {})
//  domReady(fn, context)
//  domReady(function(context) {}, ctx)
//
// https://stackoverflow.com/questions/9899372/pure-javascript-equivalent-of-jquerys-ready-how-to-call-a-function-when-t
;(function(funcName, baseObj) {
    // The public function name defaults to window.domReady
    // but you can pass in your own object and own function name and those will be used
    // if you want to put them in a different namespace
    funcName = funcName || 'domReady';
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    // call this when the document is ready
    // this function protects itself against being called more than once
    function ready() {
        if (!readyFired) {
            // this must be set to true before we start calling callbacks
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                // if a callback here happens to add new ready handlers,
                // the domReady() function will see that it already fired
                // and will schedule the callback to run right after
                // this event loop finishes so all handlers will still execute
                // in order and no new ones will be added to the readyList
                // while we are processing the list
                readyList[i].fn.call(window, readyList[i].ctx);
            }
            // allow any closures held by these functions to free
            readyList = [];
        }
    }

    function readyStateChange() {
        if ( document.readyState === 'complete' ) {
            ready();
        }
    }

    // This is the one public interface
    // domReady(fn, context);
    // the context argument is optional - if present, it will be passed
    // as an argument to the callback
    baseObj[funcName] = function(callback, context) {
        if (typeof callback !== 'function') {
            throw new TypeError('callback for domReady(fn) must be a function');
        }
        // if ready has already fired, then just schedule the callback
        // to fire asynchronously, but right away
        if (readyFired) {
            setTimeout(function() {callback(context);}, 1);
            return;
        } else {
            // add the function and context to the list
            readyList.push({fn: callback, ctx: context});
        }
        // if document already ready to go, schedule the ready function to run
        if (document.readyState === 'complete') {
            setTimeout(ready, 1);
        } else if (!readyEventHandlersInstalled) {
            // otherwise if we don't have event handlers installed, install them
            if (document.addEventListener) {
                // first choice is DOMContentLoaded event
                document.addEventListener('DOMContentLoaded', ready, false);
                // backup is window load event
                window.addEventListener('load', ready, false);
            } else {
                // must be IE
                document.attachEvent('onreadystatechange', readyStateChange);
                window.attachEvent('onload', ready);
            }
            readyEventHandlersInstalled = true;
        }
    }
})('domReady', window);

function clicked(e) {
    window.location.href = this.getAttribute('href');
    return false;
}

function main() {
    if (window.bber.env === 'reader') return;
    // Normalize link behaviour on iBooks, without interfering with footnotes
    var links = document.getElementsByTagName('a');
    links = Array.prototype.slice.call(links, 0);
    links = links.filter(function(l) {
        return l.classList.contains('footnote-ref') === false;
    });

    for (var i = 0; i < links.length; i++) {
        links[i].onclick = clicked;
    }
}

domReady(main);
`,
            },
        ]
    }
    static markdown(src) {
        return [
            {
                relativePath: Project.relativePath(
                    src,
                    '_markdown',
                    'project-name-title-page.md'
                ),
                absolutePath: Project.absolutePath(
                    src,
                    '_markdown',
                    'project-name-title-page.md'
                ),
                content: `---
title: Project Name Title Page
type: titlepage
---

::: titlepage:project-name_title-page  title:"Project Name Title Page"

# Project Title by Author

::: exit:project-name_title-page
`,
            },
            {
                relativePath: Project.relativePath(
                    src,
                    '_markdown',
                    'project-name-chapter-01.md'
                ),
                absolutePath: Project.absolutePath(
                    src,
                    '_markdown',
                    'project-name-chapter-01.md'
                ),
                content: `---
title: Project Name Chapter One
type: bodymatter
---

::: chapter:project-name_chapter-one title:"Project Name Chapter One"

# Chapter Title

Chapter Contents

::: exit:project-name_chapter-one
`,
            },
            {
                relativePath: Project.relativePath(
                    src,
                    '_markdown',
                    'project-name-colophon.md'
                ),
                absolutePath: Project.absolutePath(
                    src,
                    '_markdown',
                    'project-name-colophon.md'
                ),
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
            },
        ]
    }
    static stylesheets() {
        return []
    }
    static readme(src) {
        return {
            relativePath: Project.relativePath(src, '..', 'README.md'),
            absolutePath: Project.absolutePath(src, '..', 'README.md'),
            content: `
# ${path.basename(process.cwd())}

Created with [b-ber](https://github.com/triplecanopy/b-ber/)
`,
        }
    }
    static gitignore(src) {
        return {
            relativePath: Project.relativePath(src, '..', '.gitignore'),
            absolutePath: Project.absolutePath(src, '..', '.gitignore'),
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
