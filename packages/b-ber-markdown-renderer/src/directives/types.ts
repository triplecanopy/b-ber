import type MarkdownIt from 'markdown-it'

// Offsets into the normalized source (markdown-it's `state.src`), end
// exclusive
export interface Span {
  start: number
  end: number
}

export type Severity = 'error' | 'warning'

export type DiagnosticCode =
  | 'unknown-name'
  | 'draft-name'
  | 'deprecated-name'
  | 'missing-id'
  | 'id-characters'
  | 'duplicate-id'
  | 'unknown-attribute'
  | 'duplicate-attribute'
  | 'missing-value'
  | 'unterminated-quote'
  | 'stray-word'
  | 'attribute-form'
  | 'unclosed-block'
  | 'unmatched-exit'
  | 'crossed-exit'
  | 'exit-missing-id'
  | 'exit-trailing-text'

export interface DiagnosticNote {
  message: string
  file?: string
  span?: Span
}

// TASK-161's `Diagnostic`. Line and column are derived from `span.start`
// (see `locate`), so they are not stored
export interface Diagnostic {
  code: DiagnosticCode
  severity: Severity
  message: string
  file: string
  span: Span
  notes?: DiagnosticNote[]
}

// A markdown-it token as it sits in the tree
export interface TokenNode {
  type: string
  token: MarkdownIt.Token
  children?: TreeNode[]
}

export interface DirectiveNode {
  type: 'directive'
  name: string
  id: string
  inline: false
  // The last value of each attribute, as the spec parses them
  attrs: Record<string, string>
  // The opener line, from the fence to its last non-blank character
  position: Span
  children: TreeNode[]
  // The line after the fence, exactly as markdown-it captured it. Today's
  // renderer (b-ber-grammar-section) parses this itself, quirks included
  info: string
  // 0-based source line of the opener
  line: number
}

export type TreeNode = DirectiveNode | TokenNode

export interface TreeRoot {
  type: 'root'
  children: TreeNode[]
}

// The per-render state the directive rule reads and writes
export interface DirectiveEnv extends MarkdownIt.Env {
  // The file the diagnostics name, e.g. `_markdown/chapter-01.md`
  file?: string
  diagnostics?: Diagnostic[]
  tree?: TreeRoot
}

// How the rule coexists with the directive plugins that still track ids in
// b-ber-lib's `state.cursor` (TASK-175 removes it). Every method is called
// with the render's env. The parse itself never needs one: `pureHost` is the
// spec's behaviour.
export interface DirectiveHost {
  // Whether an `exit` line for `id` is this rule's to claim. Today only an id
  // in `state.cursor` is; any other exit goes on to grammar-pullquote
  claimsExit(id: string, env: DirectiveEnv): boolean
  // A block opener was parsed (never called in silent mode)
  opened(id: string, name: string, line: number, env: DirectiveEnv): void
  // A structural opener or `exit` with no `:id`, which today's build throws on
  missingId(name: string, line: number, env: DirectiveEnv): void
}

// Renders one of the rule's tokens, given markdown-it's token list and index
export type DirectiveRender = MarkdownIt.RendererRule
