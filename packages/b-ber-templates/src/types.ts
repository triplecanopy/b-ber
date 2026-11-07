import type { SpineItem } from '@canopycanopycanopy/b-ber-lib'

// An entry in the nested table of contents (`state.toc`, which is
// `state.spine.nested`), as the Toc and Ncx templates read it. `name` and
// `title` are read by b-ber-lib's `getTitle`.
export type TocEntry = Pick<
  SpineItem,
  'name' | 'title' | 'relativePath' | 'in_toc'
> & {
  nodes?: TocEntry[]
}
