// Whether a build's own section of config.yml (`epub:`, `web:`, ...) applies
// to that build. State is loaded from a real config.yml the way the CLI loads
// it, then a task that reads the config runs.

import path from 'node:path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import fs from 'fs-extra'
import inject from '../src/inject'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

let project
const { argv } = process

afterEach(async () => {
  process.argv = argv
  if (project) await project.cleanup()
  project = undefined
})

// What `bber build <build>` does before it runs the build's tasks: State's
// constructor loads config.yml and each build's settings, then the build
// command resets State and selects the build. State only loads build settings
// when the command line names a command, so one is given here.
const loadProject = (build) => {
  process.argv = [...argv.slice(0, 2), 'build', build]
  state.reset()
  state.loadBuilds()
  state.update('build', build)
}

describe('per-build config sections', () => {
  // Defect: State.loadBuildSettings keeps a build's section of config.yml in
  // `builds[<build>].config`, and its comment says it "gets merged into base
  // config during build step" (b-ber-lib/src/State.ts:496). Nothing reads it.
  // The build command merged it until 6f2dfa3d (2019, "Persist config
  // object", #285) removed the merge; the section has been loaded and ignored
  // since. Here the `epub:` section makes the epub build private, and the
  // epub build's pages are still marked for indexing.
  test("a build's own section does not override the base config (defect)", async () => {
    project = await createProject({ build: 'epub', chdir: true })
    await fs.writeFile(
      path.join(project.root, 'config.yml'),
      YamlAdaptor.dump({ private: false, epub: { private: true } })
    )
    loadProject('epub')
    await fs.outputFile(path.join(project.dist, 'OPS', 'text', 'one.xhtml'), '')
    await fs.ensureDir(path.join(project.dist, 'OPS', 'stylesheets'))
    await fs.ensureDir(path.join(project.dist, 'OPS', 'javascripts'))

    await inject()

    // Loaded...
    expect(state.builds.epub.config).toEqual({ private: true })
    // ...and not applied
    expect(state.config.private).toBe(false)
    const page = await fs.readFile(
      path.join(project.dist, 'OPS', 'text', 'one.xhtml'),
      'utf8'
    )
    expect(page).toContain('<meta name="robots" content="index,follow"/>')
  })
})
