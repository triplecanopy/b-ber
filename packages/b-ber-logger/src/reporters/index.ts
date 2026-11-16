import type { Reporter, ReporterName, ReporterSource } from '../types'
import { CompactReporter } from './CompactReporter'
import { LinesReporter } from './LinesReporter'

export function createReporter(
  name: ReporterName,
  source: ReporterSource
): Reporter {
  switch (name) {
    case 'progress':
      return new CompactReporter(source, true)
    case 'plain':
      return new CompactReporter(source, false)
    default:
      return new LinesReporter(source)
  }
}

export { CompactReporter, LinesReporter }
