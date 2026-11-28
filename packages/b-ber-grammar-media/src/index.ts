import type { MediaEntry } from '@canopycanopycanopy/b-ber-lib'
import {
  createAttributesString,
  createDirectiveString,
  throMissingBuildTypeError,
  throwMissingIDError,
} from './helpers'

// What a `media` or `media-inline` line resolves to when one target is built,
// from media.yml (TASK-161's "media", TASK-175):
// - `params`, the line of the directive media.yml names, after its fence;
// - `caption`, that directive's caption source, as b-ber-parser-figure read it
//   from between its `::` lines;
// - `source`, the whole replacement, for a directive no grammar renders.
//
// A pre-pass used to splice exactly these lines into the Markdown before it
// was parsed, for each target, so a document parsed differently per target.
// The directive rule now parses the `media` line as it is written, and the
// line is resolved when it renders. So the directive renders as it did
export interface ResolvedMedia {
  params: string
  caption?: string
  source: string
}

export function resolve({
  type,
  id,
  build,
  media,
}: {
  // `media` or `media-inline`
  type: string
  // Read from the line as the pre-pass read it: everything between the first
  // `:` and the next
  id: string
  // The target's name, which keys media.yml
  build: string
  media: Record<string, Record<string, MediaEntry>>
}): ResolvedMedia {
  if (!media[id]) throwMissingIDError({ id, build })
  if (!media[id][build]) throMissingBuildTypeError({ id, build })

  const { type: nextType, caption, ...rest } = media[id][build]

  // The replacement is an inline directive when the line was `media-inline`
  const modifier = /-/.test(type) ? `-${type.split('-')[1]}` : ''

  return {
    params: ` ${nextType}${modifier}:${id} ${createAttributesString(rest)}`,
    // The pre-pass wrote `:: <caption>` and a closing `::`, and the parser
    // took everything after the first line's `::` up to the closing one
    ...(caption ? { caption: ` ${caption}\n` } : {}),
    source: createDirectiveString({
      type: nextType,
      id,
      modifier,
      caption,
      rest,
    }),
  }
}

export default { resolve }
