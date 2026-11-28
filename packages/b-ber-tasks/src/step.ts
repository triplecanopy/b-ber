import type { BuildContext } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'

// One step of a target's build: runs `fn` between the logger's start and stop
// events, and returns what it returns. It replaced `serialize`, which ran a
// list of task names (TASK-165). The context is what TASK-167 tags the events
// with, so that concurrent targets can be told apart
export async function step<T>(
  _ctx: BuildContext,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  log.notify('start', name)
  const result = await fn()
  log.notify('stop', name)
  return result
}
