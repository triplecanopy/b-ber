import {
  type Diagnostic,
  parse,
} from '@canopycanopycanopy/b-ber-markdown-renderer/parse'

// What is wrong with a file's directives, in source order: the diagnostics of
// the parse the build runs, so that `bber check` and the build cannot
// disagree (#797). `file` names the file in the diagnostics, as the build
// names it: `_markdown/<name>.md`.
//
// It throws where the build's parse throws on something other than the
// directive structure (see b-ber-markdown-renderer's `parse`)
export const check = (source: string, file: string): Diagnostic[] =>
  parse(source, file).diagnostics
