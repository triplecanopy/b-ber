// markdown-it-front-matter 0.1.x ships no type declarations
declare module 'markdown-it-front-matter' {
  import type MarkdownIt from 'markdown-it'

  function markdownItFrontMatter(
    md: MarkdownIt.MarkdownIt,
    callback: (frontMatter: string) => void
  ): void

  export = markdownItFrontMatter
}
