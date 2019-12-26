<h1>
    <img alt="b-ber" src="https://user-images.githubusercontent.com/4243474/38133122-2af4f794-340e-11e8-8ac9-9b46afecfd9b.png" width="100" alt="b-ber">
</h1>

[![npm Version](https://img.shields.io/npm/v/@canopycanopycanopy/b-ber-cli.svg)](https://www.npmjs.com/search?q=@canopycanopycanopy)
[![CircleCI](https://circleci.com/gh/triplecanopy/b-ber.svg?style=svg&circle-token=5cea89db36238e6c769862031a42879123deb6dd)](https://circleci.com/gh/triplecanopy/b-ber)
[![Maintained with Lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

<!-- [![Coverage Status](https://coveralls.io/repos/triplecanopy/b-ber/badge.svg?branch=master)](https://coveralls.io/r/%3Caccount%3E/%3Crepository%3E?branch=master) -->

b-ber is both a method and an application for producing publications in a variety of formats—EPUB 3, Mobi/KF8, static website, PDF, and XML file, which can be imported into InDesign for print layouts—from a single source that consists of plain-text files and other assets. b-ber also functions as a browser-based EPUB reader, which explains the name.

To begin using b-ber, please visit the [Getting started](https://github.com/triplecanopy/b-ber/wiki/getting-started) page. For more on the rationale behind b-ber, read “[Working on Our Thoughts](https://www.canopycanopycanopy.com/series/did_you_get_the_l/contents/working-on-our-thoughts),” by Triple Canopy’s creative director, Caleb Waldorf. To see example projects produced with b-ber, please visit our [b-ber demo repository](https://github.com/triplecanopy/b-ber-demos) or [view projects online](https://www.canopycanopycanopy.com/browse?page=1&types=bber_project&sort=published_at_desc) at Triple Canopy.

While there are other frameworks for exporting content to different formats, b-ber introduces a unique paradigm for writing and marking up a text. The ability to produce multiple formats and to style each accordingly is made possible by the source of b-ber projects, which is composed of plaintext files, SCSS and JavaScript files, media, and other configuration files that are written in YAML. These plaintext files, the main text (and instructions) of a b-ber project, are written in Markdown with custom directives. b-ber extends the Markdown with custom directives that are derived from the [EPUB 3 Structural Semantic Vocabulary](https://idpf.github.io/epub-vocabs/structure/). We selected a subset of terms from that vocabulary that allows for a rich markup language that is still easily readable for writers and editors, but contains the majority of structural elements required for a published work. In addition to the directives based off the EPUB 3 Structural Semantic Vocabulary and following the same principles of readability, we developed an additional set of directives for handling different media layouts and interactive paradigms.

b-ber facilitates control of the design of publications on the level of individual formats by accounting for the specific characteristics of EPUBs, websites, PDFs, etc. b-ber’s architecture allows for the styles included in each theme to be “scoped” to different build types. In other words, the text and media treatments for an EPUB can differ from those for a browser-based version of the same publication. Existing themes, developed by Triple Canopy, include combinations of styles, typefaces, and media layouts. Alternatively, publishers can design and develop their own themes for b-ber. They can also override any of these styles at the level of the individual publication in order to craft a layout that conforms to the needs of the work. By offering high-level design flexibility and format-specific customization, b-ber enables authors, editors, designers, and technologists to simultaneously consider the ideal manifestation of a publication and the multiplicity of scenarios in which it will be encountered.

The b-ber framework is written in JavaScript, with themes written in SCSS, and distributed on npm. b-ber can be run on a personal computer or on a server. The documentation in the wiki is written for both beginners who would like to author projects as well as developers who would like to contribute to the codebase. In addition to the wiki, the repository includes further documentation and the code is heavily commented.

Find out more in the [b-ber wiki](https://github.com/triplecanopy/b-ber/blob/master/triplecanopy/b-ber/wiki/getting-started).

## Summary of Features

- Builds EPUBs, Mobi/KF8s, PDFs, static websites in both horizontal and vertical orientation, and XML files that can be imported into desktop publishing software;
- Generated output follows the [EPUB 3.0 specification](http://idpf.org/epub/30);
- Creates and links metadata that conforms to the [webpub specification](https://w3c.github.io/dpub-pwp-ucr/) for web-based publications;
- Can be styled through overrides or custom themes.

## Project Roadmap

The project roadmap will be coming soon.

## Reporting Bugs

Issues should be [reported](https://github.com/triplecanopy/b-ber/issues) in the b-ber project repository. Please use the template when creating a new issue. Issues should be tagged with the appropriately scoped label (`b-ber/create`, `b-ber/theme`, etc.) if it's clear where the issue originates. Other labels (`bug`, `enhancement`, etc.) should also be used when applicable.

## Contribution Guidelines

Pull requests are welcome. If you plan to contribute to b-ber's [development](https://github.com/triplecanopy/b-ber/wiki/Installing-b-ber-for-Development), please send an email to [b-ber@canopycanopycanopy.com](mailto:b-ber@canopycanopycanopy.com), so that we are aware of any contributions you plan on making. There is no explicit style-guide, but a style of coding that's consistent with the existing codebase should be maintained.

## Code of Conduct

We ask people to respect the code of conduct which can be read [here](https://github.com/triplecanopy/b-ber/blob/master/CODE_OF_CONDUCT.md).

## License

[GNU General Public License v3.0 or later](https://spdx.org/licenses/GPL-3.0-or-later.html).
