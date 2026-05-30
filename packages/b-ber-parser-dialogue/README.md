# b-ber-parser-dialogue

A markdown-it block-container plugin that parses b-ber `dialogue` directives into HTML. It recognises colon-fenced blocks (`:::`) with the name `dialogue` and tokenises their content into `<div>` open/close pairs. Within the container, inline text matching the pattern `:: speaker name ::` is extracted and wrapped in a `<span class="interlocutor">` element, with the parent paragraph marked `class="interlocutor-parent"`, so that speaker labels in scripted exchanges can be styled separately from the spoken text.

## Usage

This plugin is registered on a markdown-it instance by the b-ber build pipeline. A higher-level directive handler (in `b-ber-lib`) provides the `validateOpen` and `render` callbacks:

```js
import dialoguePlugin from '@canopycanopycanopy/b-ber-parser-dialogue'

md.use(dialoguePlugin, 'dialogue', { validateOpen, render })
```

The plugin is consumed as part of the `render` build step alongside the other block-container parsers.

## Dev

```
npm test
```

The test suite currently contains only a `test.todo` placeholder — no assertions are implemented yet.
