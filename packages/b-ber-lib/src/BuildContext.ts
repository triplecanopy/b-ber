// One build of one target: the project, the target, the config it resolves
// to, and the collections its tasks fill. Created per target per run and
// passed down. Never a global (TASK-160, TASK-163).
//
// While tasks still read `State`, the active context is held in an
// AsyncLocalStorage, and `State`'s per-build fields read it. Each async chain
// sees its own context, which is what lets targets run concurrently later
// without `State` leaking between them (TASK-160's spike). That shim is
// scaffolding: it goes when nothing imports `State` (TASK-173).

import { AsyncLocalStorage } from 'node:async_hooks'
import type { ConfigOptions } from './Config'
import {
  type Project,
  randomHash,
  readBuildSettings,
  resolveConfig,
} from './Project'
import type { BuildSettings } from './State'
import { getTarget, type Target } from './Target'

export interface BuildContext {
  project: Project
  // What the build produces, and what that format supports
  target: Target
  config: ConfigOptions
  settings: BuildSettings
  // Names the production stylesheet; one per build, as `State.reset` made it
  hash: string
  sequence: unknown[]
}

const storage = new AsyncLocalStorage<BuildContext>()

export function createBuildContext(
  project: Project,
  target: string
): BuildContext {
  const config = resolveConfig(project.config, target, project.overrides)
  return {
    project,
    target: getTarget(target),
    config,
    settings: readBuildSettings(config, target),
    hash: randomHash(),
    sequence: [],
  }
}

// The context of the build this code is running in, if any
export const currentBuildContext = (): BuildContext | undefined =>
  storage.getStore()

export const runInBuildContext = <T>(
  context: BuildContext,
  fn: () => Promise<T>
): Promise<T> => storage.run(context, fn)

// Builds each target in turn, each in its own context. A failure stops the
// run, as `bber build` always has; running targets concurrently, with every
// target finishing, is TASK-166
export function runBuild(
  project: Project,
  targets: string[],
  build: (context: BuildContext) => Promise<unknown>
): Promise<void> {
  // A chain rather than a loop: each target's context is created only once
  // the previous target has finished
  return targets.reduce<Promise<void>>(
    (previous, target) =>
      previous.then(async () => {
        const context = createBuildContext(project, target)
        await runInBuildContext(context, () => build(context))
      }),
    Promise.resolve()
  )
}
