import {
  type BuildContext,
  createBuildContext,
  loadProject,
  runInBuildContext,
} from '@canopycanopycanopy/b-ber-lib'

// Runs one task on its own, for the commands that do (`bber opf`, `bber
// cover`): in a context for `target`, from the project in the working
// directory. Every task takes the build's context (TASK-165)
export const inBuildContext = <T>(
  target: string,
  fn: (ctx: BuildContext) => Promise<T>
): Promise<T> => {
  const ctx = createBuildContext(loadProject(process.cwd()), target)
  return runInBuildContext(ctx, () => fn(ctx))
}
