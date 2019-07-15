<h1>
    <img alt="b-ber" src="https://user-images.githubusercontent.com/4243474/38133122-2af4f794-340e-11e8-8ac9-9b46afecfd9b.png" width="100" alt="b-ber">
</h1>

[![npm Version](https://img.shields.io/npm/v/@canopycanopycanopy/b-ber-cli.svg)](https://www.npmjs.com/search?q=@canopycanopycanopy)
[![CircleCI](https://circleci.com/gh/triplecanopy/b-ber.svg?style=svg&circle-token=5cea89db36238e6c769862031a42879123deb6dd)](https://circleci.com/gh/triplecanopy/b-ber)
[![Maintained with Lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Coverage Status](https://coveralls.io/repos/triplecanopy/b-ber/badge.svg?branch=master)](https://coveralls.io/r/%3Caccount%3E/%3Crepository%3E?branch=master)

b-ber a framework that produces a variety of formats—EPUB 3, Mobi/KF8, static websites, PDFs, and XML files (that can be imported into Adobe InDesign)—as well as a browser-based EPUB reader (hence the name “b-ber”). These files and formats are generated from a single source of plaintext files and other assets.

While there are other frameworks for exporting content to different formats, b-ber introduces a unique paradigm for writing and marking up a text. The ability to produce multiple formats and to style each accordingly is made possible by the source of b-ber projects, which is composed of plaintext files, SASS and Javascript files, media, and other configuration files that are written in YAML. These plaintext files, the main text (and instructions) of a b-ber project, are written in Markdown with custom directives. b-ber extends the Markdown with custom directives that are derived from the [EPUB 3 Structural Semantic Vocabulary] (https://idpf.github.io/epub-vocabs/structure/). We selected a subset of terms from that vocabulary that allows for a rich markup language that is still easily readable for writers and editors but contains the majority of structural elements required for a published work. In addition to the directives based off the EPUB 3 Structural Semantic Vocabulary and following the same principles of readability, we developed an additional set of directives for handling different media layouts and interactive paradigms.

b-ber’s visual design and interactivity attempt to account for the affordances of the individual output formats. This is accomplished by the system’s architecture, which allows for all styles to be “scoped” to specific build types. In other words, the downloadable EPUB can have text and media treatments that are distinct from what is in the browser-based reader or other formats. These styles are contained within overall themes, which include all styles, typefaces, and layouts. In addition, there is a possibility to override any of these styles at the project-specific level, providing even more opportunity to adapt to a specific work’s needs on a case-by-case basis. The combination of high-level design flexibility with format-specific customization offers the opportunity to consider how to design a project that accounts for both the authorial intent and multiplicity of scenarios in which the work will be encountered.

The b-ber framework is written in Javascript (with themes written in Sass) and distributed on npm. b-ber can be run on a personal computer or on a server. The documentation in the wiki is written for both beginners who would like to author projects as well as developers who would like to contribute to the codebase. In addition to the wiki, the repository includes further documentation and the code is heavily commented.

To get started, please visit the wiki [here](https://github.com/triplecanopy/b-ber/blob/master/triplecanopy/b-ber/wiki/getting-started).

## Summary of Features

- Builds ePubs, Mobis, PDFs, static websites in both horizontal and vertical orientation, and XML files that can be imported into desktop publishing software;
- Generated output follows the [EPUB 3.0 specification](http://idpf.org/epub/30);
- Creates and embeds rich metadata in JSON-LD;
- Creates metadata that conforms to the [webpub specification](https://w3c.github.io/dpub-pwp-ucr/) for web-based publications;
- Can be styled through overrides or custom themes;
- TK Can be used as a utility library by accessing its component modules.

A demo project for all the build types can be downloaded TK here.

## Project Roadmap

In addition to bug fixes and ongoing maintenance, below are some currently known [enhancements](https://github.com/triplecanopy/b-ber/labels/enhancement) that we plan on devleoping for future releases:

- Further styling and testing for outputed formats;
- Extended metadata;
- Develop system to generate pages from metadata and create templating system;
- Create a more 'pluggable' interface:
    - Allow users to create and integrate their own markdown-it plugins;
    - Allow users to create their own b-ber extensions.
- Modularize b-ber:
    - b-ber packages can continue to be extracted from the core b-ber package for maintenance and customization.

## Reporting Bugs

Issues should be [reported](https://github.com/triplecanopy/b-ber/issues) at the **b-ber** project repository. Please use the template when creating a new issue. Issues should be tagged with the appropriately scoped label (`b-ber/create`, `b-ber/theme`, etc.) if it's clear where the issue originates. Other labels (`bug`, `enhancement`, etc.) should also be used when applicable.

## Contribution Guidelines

Pull requests are welcome. If you plan to contribute to **b-ber's** development please send a notification to [b-ber@canopycanopycanopy.com](mailto:b-ber@canopycanopycanopy.com), so that we are aware of any contributions you plan on making. There is no explicit style-guide, but a style of coding that's consistent with the existing codebase should be maintained.

## Code of Conduct

We ask people to respect the code of conduct which can be read [here](https://github.com/triplecanopy/b-ber/blob/master/CODE_OF_CONDUCT.md).

## License

[GNU General Public License v3.0 or later](https://spdx.org/licenses/GPL-3.0-or-later.html)
