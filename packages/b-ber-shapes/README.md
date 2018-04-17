# `bber-shapes`

`bber-shapes/dc` contains lists of [`Dublin Core®`](http://dublincore.org/) metadata that is referenced throughout the application lifecyle.

`bber-shapes/directives` exports lists of `b-ber` "directives"<a id="custom-directives-ref" href="#custom-directives-note">*</a> that are referenced during when `b-ber` parses and renders Markdown. It also exports information about directive attributes, as well as expected output (used for testing).

`bber-shapes/sequences` exports lists of `b-ber` commands which are invoked during the `build` task. 

<a id="#custom-directives-note" href="#custom-directives-ref">*</a>Read more about directives [here](https://github.com/triplecanopy/b-ber/tree/master/packages/b-ber-grammar).
