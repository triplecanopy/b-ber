// The parse without the render: what `bber check` runs (b-ber-validator).
// Published as the package's `/parse` subpath, the one entry point a checker
// imports, so that consolidating the directive packages (TASK-179) changes
// only its name.
//
// It is the build's own parse: the same markdown-it instance setup, every
// plugin registered in the same order, so the two cannot disagree about a
// document (#797). The one difference is the host. The build's throws on a
// duplicate or missing id, as the build always has; this one leaves both as
// diagnostics, so that one run reports every problem in a file.
//
// The grammar packages are still loaded, since the single-line directives'
// claims, the gallery items and the footnotes are parsed by code that lives
// beside their renderers until TASK-179 folds them in. Nothing here renders.

import path from 'node:path'
import { type Diagnostic, pureHost, type TreeRoot } from './directives'
import { MarkdownRenderer } from './index'

export { type Location, locate } from './directives/diagnostics'
export type {
  Diagnostic,
  DiagnosticCode,
  DiagnosticNote,
  Severity,
  Span,
  TreeRoot,
} from './directives/types'

export interface ParsedDocument {
  // In source order
  diagnostics: Diagnostic[]
  tree: TreeRoot
}

// Made on first use: a markdown-it instance with every plugin is not free
let parser: MarkdownRenderer | undefined

// Parses `source` as the build parses it. `file` is the name the diagnostics
// carry, as the build names them: `_markdown/<name>.md`. The parse is the same
// for every target (`media` is resolved when it renders), so none is given.
//
// It throws where the build's parse throws for a reason other than the
// directive structure: a single-line directive's grammar on a line it cannot
// use (`figure` without a `source`), and front matter with a `type` and no
// `title` (#735)
export function parse(source: string, file: string): ParsedDocument {
  parser ??= new MarkdownRenderer(pureHost)
  const env = parser.parse(path.basename(file, '.md'), source, { file })
  return {
    diagnostics: env.diagnostics ?? [],
    tree: env.tree ?? { type: 'root', children: [] },
  }
}
