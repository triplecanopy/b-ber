<h1>
    <img alt="b-ber" src="https://user-images.githubusercontent.com/4243474/38133122-2af4f794-340e-11e8-8ac9-9b46afecfd9b.png" width="100" alt="b-ber">
</h1>

<p>
<a href="https://www.npmjs.com/search?q=@canopycanopycanopy" rel="nofollow">
<img src="https://img.shields.io/npm/v/@canopycanopycanopy/b-ber-cli.svg" alt="npm Version" data-canonical-src="https://img.shields.io/npm/v/@canopycanopycanopy/b-ber-cli.svg" style="max-width:100%;"></a>
<a href="https://lernajs.io/" rel="nofollow"><img src="https://camo.githubusercontent.com/ecafd86d8356a1adc60fb4fd393bcc7584187f99/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f6d61696e7461696e6564253230776974682d6c65726e612d6363303066662e737667" alt="lerna" data-canonical-src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" style="max-width:100%;"></a>
<a href="https://travis-ci.com/triplecanopy/b-ber/" rel="nofollow"><img src="https://travis-ci.com/triplecanopy/b-ber.svg?token=d5sXqMpXEby4v8y2wENP&branch=master" alt="Build Status" data-canonical-src="https://travis-ci.com/triplecanopy/b-ber.svg?token=d5sXqMpXEby4v8y2wENP&branch=master" style="max-width:100%;"></a>
<a href="https://coveralls.io/r/%3Caccount%3E/%3Crepository%3E?branch=master" rel="nofollow"><img src="https://camo.githubusercontent.com/7486c7bf19a1b36a8c836f81e02453b9f84598e0/68747470733a2f2f636f766572616c6c732e696f2f7265706f732f747269706c6563616e6f70792f622d6265722f62616467652e7376673f6272616e63683d6d6173746572" alt="Coverage Status" data-canonical-src="https://coveralls.io/repos/triplecanopy/b-ber/badge.svg?branch=master" style="max-width:100%;"></a>
</p>

**b-ber** is TK...

**b-ber** can be run on a personal computer or on a server. This user manual was written for both beginners who would like to author projects, as well as developers who like to contribute to the project. In addition, the repository includes further documentation and the code is heavily commented.

To get started, please visit the wiki [here](/triplecanopy/b-ber/wiki/getting-started).

## Summary of Features

- Builds ePubs, Mobis, PDFs, static websites in both horizontal and vertical orientation, and XML files that can be imported into desktop publishing software;
- Generated output follows the [EPUB 3.0 specification](http://idpf.org/epub/30);
- Creates and embeds rich metadata in JSON-LD;
- Creates metadata that conforms to the [webpub specification](https://w3c.github.io/dpub-pwp-ucr/) for web-based publications;
- Can be styled through overrides or custom themes;
- TK Can be used as a utility library by accessing its component modules.

Demo projects, which include all of the functionality described in the wiki can be found below:

- EPUB 3.0 TK
- Mobi TK
- PDF TK
- Web
- IDML TK

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

Issues should be [reported](https://github.com/triplecanopy/b-ber/issues) at the b-ber project repository. Please use the template when creating a new issue. Issues should be tagged with the appropriately scoped label (b-ber/create, b-ber/theme, etc.) if it's clear where the issue originates. Other labels (bug, enhancement, etc.) should also be used when applicable.

## Contribution Guidelines

Pull requests are welcome. If you plan to contribute to b-ber's development please send a notification to [b-ber@canopycanopycanopy.com](mailto:b-ber@canopycanopycanopy.com), so that we are aware of any contributions you plan on making. There is no explicit style-guide, but a style of coding that's consistent with the existing codebase should be maintained.

## Code of Conduct

We ask people to respect the code of conduct which can be read [here](https://github.com/triplecanopy/b-ber/blob/master/CODE_OF_CONDUCT.md).

## License

[GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)
