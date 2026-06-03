Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let _canopycanopycanopy_b_ber_lib = require("@canopycanopycanopy/b-ber-lib");
let lodash_find_js = require("lodash/find.js");
lodash_find_js = __toESM(lodash_find_js);
let lodash_has_js = require("lodash/has.js");
lodash_has_js = __toESM(lodash_has_js);
let vinyl = require("vinyl");
vinyl = __toESM(vinyl);
let _canopycanopycanopy_b_ber_logger = require("@canopycanopycanopy/b-ber-logger");
_canopycanopycanopy_b_ber_logger = __toESM(_canopycanopycanopy_b_ber_logger);
let path = require("path");
path = __toESM(path);
let mime_types = require("mime-types");
mime_types = __toESM(mime_types);
let crypto = require("crypto");
crypto = __toESM(crypto);
//#region src/Ncx/index.ts
const { getTitle: getTitle$1 } = _canopycanopycanopy_b_ber_lib.utils;
var Ncx = class Ncx {
	static head() {
		const entry = (0, lodash_find_js.default)(_canopycanopycanopy_b_ber_lib.State.metadata.json(), { term: "identifier" });
		return `
      <head>
        <meta name="dtb:uid" content="${entry && (0, lodash_has_js.default)(entry, "value") ? entry.value : ""}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="1"/>
        <meta name="dtb:maxPageNumber" content="1"/>
      </head>
    `;
	}
	static title() {
		const entry = (0, lodash_find_js.default)(_canopycanopycanopy_b_ber_lib.State.metadata.json(), { term: "title" });
		const title = entry && (0, lodash_has_js.default)(entry, "value") ? entry.value : "";
		return `
      <docTitle>
        <text>${_canopycanopycanopy_b_ber_lib.Html.escape(title)}</text>
      </docTitle>
    `;
	}
	static author() {
		const entry = (0, lodash_find_js.default)(_canopycanopycanopy_b_ber_lib.State.metadata.json(), { term: "creator" });
		const creator = entry && (0, lodash_has_js.default)(entry, "value") ? entry.value : "";
		return `
      <docAuthor>
        <text>${_canopycanopycanopy_b_ber_lib.Html.escape(creator)}</text>
      </docAuthor>
    `;
	}
	static document() {
		return new vinyl.default({
			path: "ncx.document.tmpl",
			contents: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
        <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
          ${Ncx.head()}
          ${Ncx.title()}
          ${Ncx.author()}
          <navMap>
            {% body %}
          </navMap>
        </ncx>
      `)
		});
	}
	static navPoint(data) {
		return `
      <navLabel>
        <text>${_canopycanopycanopy_b_ber_lib.Html.escape(getTitle$1(data))}</text>
      </navLabel>
      <content src="${data.relativePath}.xhtml" />
    `;
	}
	static navPoints(data) {
		let index = 0;
		function render(nodes) {
			if (!nodes || !nodes.length) return "";
			return nodes.reduce((acc, curr) => {
				if (curr.in_toc === false) return acc;
				index += 1;
				return acc.concat(`
          <navPoint id="navPoint-${index}" playOrder="${index}">
            ${Ncx.navPoint(curr)}
            ${render(curr.nodes)}
          </navPoint>
        `);
			}, "");
		}
		return render(data);
	}
};
//#endregion
//#region src/Opf/Guide.ts
var Guide = class Guide {
	static body() {
		return new vinyl.default({
			path: "guide.body.tmpl",
			contents: Buffer.from("<guide>{% body %}</guide>")
		});
	}
	static item({ type, title, href }) {
		return `<reference type="${type}" title="${title}" href="${href}"/>`;
	}
	static items(data) {
		return data.reduce((acc, curr) => {
			if (!curr.type) return acc;
			_canopycanopycanopy_b_ber_logger.default.info(`guide adding landmark [${curr.fileName}] as [${curr.type}]`);
			const { type } = curr;
			const title = _canopycanopycanopy_b_ber_lib.Html.escape(curr.title);
			const href = `text/${encodeURI(path.default.basename(curr.fileName, ".xhtml"))}.xhtml`;
			return acc.concat(Guide.item({
				type,
				title,
				href
			}));
		}, "");
	}
};
//#endregion
//#region src/Opf/Manifest.ts
const { fileId: fileId$2 } = _canopycanopycanopy_b_ber_lib.utils;
const getProps = (file) => {
	const props = _canopycanopycanopy_b_ber_lib.ManifestItemProperties.testHTML(file);
	return props && props.length ? `properties="${props.join(" ")}"` : "";
};
const getMediaType = ({ remote, absolutePath }) => remote ? "application/octet-stream" : mime_types.default.lookup(absolutePath);
var Manifest = class {
	static body() {
		return new vinyl.default({
			path: "manifest.body.tmpl",
			contents: Buffer.from("<manifest>{% body %}</manifest>")
		});
	}
	static item(file) {
		return `<item id="${fileId$2(file.name)}" href="${encodeURI(file.opsPath)}" media-type="${getMediaType(file)}" ${getProps(file)}/>`;
	}
};
//#endregion
//#region src/Opf/Metadata.ts
const { fileId: fileId$1 } = _canopycanopycanopy_b_ber_lib.utils;
var Metadata = class Metadata {
	static uid() {
		return `_${crypto.default.randomBytes(8).toString("hex")}`;
	}
	static body() {
		return new vinyl.default({
			path: "metadata.body.tmpl",
			contents: Buffer.from("<metadata>{% body %}</metadata>")
		});
	}
	static meta(data) {
		const { term, element } = _canopycanopycanopy_b_ber_lib.ManifestItemProperties.testMeta(data);
		const itemid = element && data.term === "identifier" ? "uuid" : Metadata.uid();
		let res = [];
		if (term) res.push(`<meta property="dcterms:${data.term}">${_canopycanopycanopy_b_ber_lib.Html.escape(data.value)}</meta>`);
		if (element) res.push(`<dc:${data.term} id="${itemid}">${_canopycanopycanopy_b_ber_lib.Html.escape(data.value)}</dc:${data.term}>`);
		if (data.refines) {
			const refines = data.refines.reduce((acc, curr) => acc.concat(Object.entries(curr).map(([key, value]) => `<meta refines="#${itemid}" property="${key}">${_canopycanopycanopy_b_ber_lib.Html.escape(value)}</meta>`)), []);
			res = res.concat(refines);
		}
		if (term && element && data.term_property && data.term_property_value) {
			let message = "\n";
			message += "You're using an outdated syntax in `metadata.yml` which will be removed in future versions.";
			message += "\nUpdate the entries in the `metadata.yml` file to use the new `refines` syntax:";
			message += `

                  -   - term: ${data.term}
                  -     value: ${data.value}
                  -     term_property: ${data.term_property}
                  -     term_property_value: ${data.term_property_value}
                  +    - term: ${data.term}
                  +      value: ${data.value}
                  +      - refines:
                  +        - ${data.term_property}: ${data.term_property_value}
                  `;
			_canopycanopycanopy_b_ber_logger.default.notice(message);
			res.push(`<meta refines="#${itemid}" property="${data.term_property}">${_canopycanopycanopy_b_ber_lib.Html.escape(data.term_property_value)}</meta>`);
		}
		if (!term && !element) if (data.term !== "cover") res.push(`<meta name="${data.term}" content="${_canopycanopycanopy_b_ber_lib.Html.escape(data.value)}"/>`);
		else res.push(`<meta name="${data.term}" content="${fileId$1(_canopycanopycanopy_b_ber_lib.Html.escape(data.value))}"/>`);
		return res.join("");
	}
};
//#endregion
//#region src/Opf/Pkg.ts
var Pkg = class {
	static body() {
		return new vinyl.default({
			path: "pkg.body.tmpl",
			contents: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
                <package
                    version="3.0"
                    xml:lang="en"
                    unique-identifier="uuid"
                    xmlns="http://www.idpf.org/2007/opf"
                    xmlns:dc="http://purl.org/dc/elements/1.1/"
                    xmlns:dcterms="http://purl.org/dc/terms/"
                    prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/"
                >
                    {% body %}
                </package>
            `)
		});
	}
};
//#endregion
//#region src/Opf/Spine.ts
const { fileId } = _canopycanopycanopy_b_ber_lib.utils;
var Spine = class Spine {
	static body() {
		return new vinyl.default({
			path: "spine.body.tmpl",
			contents: Buffer.from("<spine toc=\"_toc_ncx\">{% body %}</spine>")
		});
	}
	static item({ fileName, extension, linear }) {
		return `<itemref idref="${fileId(path.default.basename(fileName, extension))}_xhtml" linear="${linear ? "yes" : "no"}"/>`;
	}
	static items(data) {
		return data.reduce((acc, curr) => {
			const { fileName } = curr;
			if (curr.linear === false) {
				if (_canopycanopycanopy_b_ber_lib.State.build === "mobi") {
					_canopycanopycanopy_b_ber_logger.default.info(`opf templates/spine omitting non-linear asset [${fileName}] for mobi build`);
					return acc;
				}
				_canopycanopycanopy_b_ber_logger.default.info(`opf templates/spine writing non-linear asset [${fileName}]`);
			}
			if (fileName === "figures-titlepage") {
				_canopycanopycanopy_b_ber_logger.default.info("opf templates/spine writing [loi]");
				if (_canopycanopycanopy_b_ber_lib.State.loi.length) return acc.concat(_canopycanopycanopy_b_ber_lib.State.loi.reduce((acc2, curr2) => acc2.concat(Spine.item({
					...curr2,
					linear: true
				})), Spine.item(curr)));
			}
			return acc.concat(Spine.item(curr));
		}, "");
	}
};
//#endregion
//#region src/Opf/index.ts
var Opf_exports = /* @__PURE__ */ __exportAll({
	Guide: () => Guide,
	Manifest: () => Manifest,
	Metadata: () => Metadata,
	Pkg: () => Pkg,
	Spine: () => Spine
});
//#endregion
//#region src/Ops/index.ts
var Ops = class {
	static mimetype() {
		return "application/epub+zip";
	}
};
//#endregion
//#region src/Project/application.js.ts
var application_js_default = `// All user defined functions should be wrapped in a 'domReady' call - or by using a third-party lib like jQuery - for compatibility in reader, web, and e-reader versions.
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
`;
//#endregion
//#region src/Project/gitignore.ts
var gitignore_default = `.DS_Store
.tmp

*.map
*.epub
*.mobi
*.pdf
*.xml

node_modules
npm-debug.log*
bber-debug.log*

/project*
`;
//#endregion
//#region src/Project/metadata.yml.ts
var metadata_yml_default = `# ==============================================================================
# Project Metadata
# Please see http://dublincore.org/documents/dcmi-terms/ for information on terms
# and usage. Additional metadata can be entered and parsed if following the
# formatting below.
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# Title and Description
# ------------------------------------------------------------------------------

- term: title
  value: Project Title
  refines:
    - title-type: main

- term: description
  value: Project description.

- term: abstract
  value: Abstract.

# ------------------------------------------------------------------------------
# Contributors
# ------------------------------------------------------------------------------

- term: creator
  value: Last Name, First Name
  refines:
    - role: aut

- term: contributor
  value: b-ber
  refines:
    - role: mrk

# ------------------------------------------------------------------------------
# Collaborators (editors, developers, designers, researchers, etc.)
# ------------------------------------------------------------------------------

- term: contributor
  value: Last Name, First Name
  refines:
    - role: edt

- term: contributor
  value: Last Name, First Name
  refines:
    - role: drt

- term: contributor
  value: Last Name, First Name
  refines:
    - role: ard

- term: contributor
  value: Last Name, First Name
  refines:
    - role: pmn

- term: contributor
  value: Last Name, First Name
  refines:
    - role: prg

- term: contributor
  value: Last Name, First Name
  refines:
    - role: dsr

- term: contributor
  value: Last Name, First Name
  refines:
    - role: mrk

- term: contributor
  value: Last Name, First Name
  refines:
    - role: rtm

# ------------------------------------------------------------------------------
# Publication Information
# ------------------------------------------------------------------------------

- term: language
  value: en-US

- term: rights
  value: © YYYY

- term: format
  value: epub+zip

- term: date
  value: YYYY-MM-DD

- term: publisher
  value: Publisher

- term: tableOfContents
  value: Chapter One; Chapter Two; etc.

# ------------------------------------------------------------------------------
# Additional Metadata
# ------------------------------------------------------------------------------

- term: temporal
  value: time

- term: spatial
  value: Project Title Location

- term: subject
  value: Project Title Subject

# ------------------------------------------------------------------------------
# Cover and Book ID (UUID, ISBN, ISSN, ASIN, etc.)
# ------------------------------------------------------------------------------

- term: identifier
  value: %IDENTIFIER%

`;
//#endregion
//#region src/Project/project-name-chapter-01.md.ts
var project_name_chapter_01_md_default = `---
title: Project Name Chapter One
type: bodymatter
---

::: chapter:project-name_chapter-one

# Chapter Title

Chapter Contents

::: exit:project-name_chapter-one
`;
//#endregion
//#region src/Project/project-name-colophon.md.ts
var project_name_colophon_md_default = `---
title: Project Name Colophon
type: colophon
---

::: colophon:project-name-colophon

*Project Title* by Author

Published by Publisher, 2019

::: subchapter:credits

© 2019 *Project Title*, by Author. Texts and images copyright the author, unless otherwise stated.

::: exit:credits

::: logo:publishers-logo source:default-publishers-logo.png

Publisher
1234 Street
City, State Zip
Country

::: logo:b-ber-logo source:b-ber-logo.png

*Project Title* is a DRM-free ebook that uses [b-ber](https://github.com/triplecanopy/b-ber), software designed and developed by [Triple Canopy](https://canopycanopycanopy.com).

::: exit:project-name-colophon
`;
//#endregion
//#region src/Project/project-name-title-page.md.ts
var project_name_title_page_md_default = `---
title: Project Name Title Page
type: titlepage
---

::: titlepage:project-name-title-page

# Project Title by Author

::: exit:project-name-title-page
`;
//#endregion
//#region src/Project/README.md.ts
var README_md_default = `# %PROJECT_NAME%

Created with [b-ber](https://github.com/triplecanopy/b-ber/)
`;
//#endregion
//#region src/Project/toc.yml.ts
var toc_yml_default = `# Table of Contents
# "in_toc:false" removes the entry from the built-in navigation of the reader.
# "linear:false" removes the entry from the project's contents.
- toc:
        in_toc: false
        linear: false
# Cover
- cover:
        in_toc: false
# Project Contents
- project-name-title-page
- project-name-chapter-01
- project-name-colophon
`;
//#endregion
//#region src/Project/index.ts
var Project = class Project {
	static directories(src) {
		return [
			`${src}/_images`,
			`${src}/_javascripts`,
			`${src}/_stylesheets`,
			`${src}/_markdown`,
			`${src}/_fonts`,
			`${src}/_media`,
			`${src}/.tmp`
		];
	}
	static relativePath(src, ...rest) {
		return path.default.join(path.default.basename(src), ...rest);
	}
	static absolutePath(src, ...rest) {
		return path.default.resolve(path.default.dirname(src), path.default.basename(src), ...rest);
	}
	static configYAML(src, config = {}) {
		return {
			relativePath: Project.relativePath(src, "..", "config.yml"),
			absolutePath: Project.absolutePath(src, "..", "config.yml"),
			content: _canopycanopycanopy_b_ber_lib.YamlAdaptor.dump({
				..._canopycanopycanopy_b_ber_lib.State.config,
				...config
			})
		};
	}
	static tocYAML(src) {
		return {
			relativePath: Project.relativePath(src, "toc.yml"),
			absolutePath: Project.absolutePath(src, "toc.yml"),
			content: toc_yml_default
		};
	}
	static metadataYAML(src) {
		return {
			relativePath: Project.relativePath(src, "metadata.yml"),
			absolutePath: Project.absolutePath(src, "metadata.yml"),
			content: metadata_yml_default.replace(/%IDENTIFIER%/, crypto.default.randomBytes(20).toString("hex"))
		};
	}
	static javascripts(src) {
		return [{
			relativePath: Project.relativePath(src, "_javascripts", "application.js"),
			absolutePath: Project.absolutePath(src, "_javascripts", "application.js"),
			content: application_js_default
		}];
	}
	static markdown(src) {
		return [
			{
				relativePath: Project.relativePath(src, "_markdown", "project-name-title-page.md"),
				absolutePath: Project.absolutePath(src, "_markdown", "project-name-title-page.md"),
				content: project_name_title_page_md_default
			},
			{
				relativePath: Project.relativePath(src, "_markdown", "project-name-chapter-01.md"),
				absolutePath: Project.absolutePath(src, "_markdown", "project-name-chapter-01.md"),
				content: project_name_chapter_01_md_default
			},
			{
				relativePath: Project.relativePath(src, "_markdown", "project-name-colophon.md"),
				absolutePath: Project.absolutePath(src, "_markdown", "project-name-colophon.md"),
				content: project_name_colophon_md_default
			}
		];
	}
	static stylesheets() {
		return [];
	}
	static readme(src) {
		return {
			relativePath: Project.relativePath(src, "..", "README.md"),
			absolutePath: Project.absolutePath(src, "..", "README.md"),
			content: README_md_default.replace(/%PROJECT_NAME%/, path.default.basename(process.cwd()))
		};
	}
	static gitignore(src) {
		return {
			relativePath: Project.relativePath(src, "..", ".gitignore"),
			absolutePath: Project.absolutePath(src, "..", ".gitignore"),
			content: gitignore_default
		};
	}
};
//#endregion
//#region src/Toc/index.ts
const { getTitle } = _canopycanopycanopy_b_ber_lib.utils;
var Toc = class Toc {
	static body() {
		return new vinyl.default({ contents: Buffer.from(`<nav id="toc" epub:type="toc"><h2>Table of Contents</h2>{% body %}</nav>`) });
	}
	static item(data) {
		return `<a href="${`${data.relativePath}.xhtml`}">${_canopycanopycanopy_b_ber_lib.Html.escape(getTitle(data))}</a>`;
	}
	static items(data) {
		return `
      <ol>
        ${data.reduce((acc, curr) => {
			if (curr.in_toc === false) return acc;
			return acc.concat(`
            <li>
              ${Toc.item(curr)}
              ${curr.nodes && curr.nodes.length ? Toc.items(curr.nodes) : ""}
            </li>
          `);
		}, "")}
      </ol>
  `;
	}
};
//#endregion
//#region src/Xhtml/index.ts
var Xhtml = class {
	static head() {
		const prefix = _canopycanopycanopy_b_ber_lib.State.config.private ? "no" : "";
		const robots = `<meta name="robots" content="${prefix}index,${prefix}follow"/>`;
		return new vinyl.default({ contents: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <html xmlns="http://www.w3.org/1999/xhtml"
          xmlns:epub="http://www.idpf.org/2007/ops"
          xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
          epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
        <head>
          <title></title>
          <meta http-equiv="default-style" content="text/html charset=utf-8"/>
          ${robots}
          {% body %}
        </head>
        <body>
      `) });
	}
	static body() {
		return new vinyl.default({ contents: Buffer.from("{% body %}") });
	}
	static tail() {
		return new vinyl.default({ contents: Buffer.from("{% body %}</body></html>") });
	}
	static cover({ width, height, href }) {
		return `
      <section class="cover" style="text-align: center; padding: 0; margin: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" height="100%" preserveAspectRatio="xMidYMid meet" version="1.1" viewBox="0 0 ${width} ${height}" width="100%" xmlns:xlink="http://www.w3.org/1999/xlink">
          <image width="${width}" height="${height}" xlink:href="../${href}"/>
        </svg>
      </section>
    `;
	}
	static stylesheet(inline = false) {
		return inline ? new vinyl.default({ contents: Buffer.from("<style>{% body %}</style>") }) : new vinyl.default({ contents: Buffer.from("<link rel=\"stylesheet\" type=\"text/css\" href=\"{% body %}\"/>") });
	}
	static javascript(inline = false) {
		return inline ? new vinyl.default({ contents: Buffer.from("<script type=\"application/javascript\">{% body %}<\/script>") }) : new vinyl.default({ contents: Buffer.from("<script type=\"application/javascript\" src=\"{% body %}\"><\/script>") });
	}
	static jsonLD() {
		return new vinyl.default({ contents: Buffer.from("<script type=\"application/ld+json\">{% body %}<\/script>") });
	}
	static loi() {
		return `
      <section epub:type="loi" class="chapter figures">
        <header>
          <h1>Figures</h1>
        </header>
      </section>
    `;
	}
};
//#endregion
//#region src/Xml/index.ts
var Xml = class {
	static container() {
		return `<?xml version="1.0"?>
            <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
                <rootfiles>
                    <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>
                </rootfiles>
            </container>
        `;
	}
	static mimetype() {
		return "application/epub+zip";
	}
};
//#endregion
exports.Ncx = Ncx;
Object.defineProperty(exports, "Opf", {
	enumerable: true,
	get: function() {
		return Opf_exports;
	}
});
exports.Ops = Ops;
exports.Project = Project;
exports.Toc = Toc;
exports.Xhtml = Xhtml;
exports.Xml = Xml;
