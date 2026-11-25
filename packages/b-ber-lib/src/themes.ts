/* eslint-disable global-require */

import type { ThemeModule } from './State'

let cache: Record<string, ThemeModule> | undefined

// The themes that ship with b-ber, by name. Required on first use rather than
// when b-ber-lib is imported: each theme package lists its fonts and images
// directories as it loads
export function builtInThemes(): Record<string, ThemeModule> {
  cache ||= {
    'b-ber-theme-serif': require('@canopycanopycanopy/b-ber-theme-serif'),
    'b-ber-theme-sans': require('@canopycanopycanopy/b-ber-theme-sans'),
  }
  return cache
}
