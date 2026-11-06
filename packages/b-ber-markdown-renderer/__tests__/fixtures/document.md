---
title: Rendering Fixture
type: bodymatter
---

::: chapter:rendering-fixture

# Rendering Fixture

Prose with *emphasis*, **strong**, ***both***, _underscores_, `code`, a [link](https://example.com "Title"), a [reference link][ref], an autolink <https://example.com>, and a hard break  
after two spaces, then a backslash hard break\
here.

Entities and punctuation: &copy; &amp; &#169; &#x2014; &nbsp; "straight" 'quotes' -- dashes... (c) (tm) 1 < 2 > 0.

Inline HTML: <span class="smallcaps">small caps</span>, <em>em</em>, <br/> and a comment <!-- inline comment --> in a line.

<div class="html-block">

Markdown *inside* an HTML block.

</div>

<!-- a block comment -->

[ref]: https://example.com/ref "Reference"

## Footnotes

A reference footnote.[^ref] The same note again.[^ref] Another one.[^two] An inline note.^[Inline note with *emphasis* and a [link](https://example.com).]

[^ref]: The reference note, with `code` and **strong**.

[^two]: A multi-paragraph note.

    Its second paragraph, indented.

## Sections and quotes

::: subchapter:fixture-outer

Outer section.

::: subchapter:fixture-inner classes:"one two"

Inner section.

::: exit:fixture-inner

::: exit:fixture-outer

::: pullquote:fixture-pullquote citation:"Someone"

A pull quote.

::: exit:fixture-pullquote

::: blockquote:fixture-blockquote citation:"A. Citation"

Quoted text with *emphasis*.

::: exit:fixture-blockquote

> A plain blockquote
> spanning lines.
>
> > Nested.

## Dialogue

::: dialogue:fixture-dialogue

:: Alice :: Hello there.

:: Bob :: Hi, *Alice*.

A line without a speaker.

::: exit:fixture-dialogue

## Lists

- one
- two
  - nested
  - nested *emphasis*
- three

1. first
2. second

3) paren list

- loose item

- loose item

## Code

```js
const x = 1 // highlighted
```

```
plain fence <tag> & amp
```

    indented code <tag>

## Tables and rules

| left | center | right |
|:-----|:------:|------:|
| a    | `b`    | **c** |

***

Setext heading
--------------

![An image](../images/example.png "Image title")

Escapes: \*not emphasis\* \# \[not a link\]

::: exit:rendering-fixture
