// Whether a build's own section of config.yml (`epub:`, `web:`, ...) applies
// to that build. The project is loaded from a real config.yml the way the CLI
// loads it (b-ber-lib's loadProject), and a task that reads the config runs in
// the build's context.

import path from 'node:path'
import {
  createBuildContext,
  loadProject,
  runInBuildContext,
} from '@canopycanopycanopy/b-ber-lib'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import fs from 'fs-extra'
import inject from '../src/inject'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

let project

afterEach(async () => {
  if (project) await project.cleanup()
  project = undefined
})

const robots = async (dist) => {
  await fs.outputFile(path.join(dist, 'OPS', 'text', 'one.xhtml'), '')
  await fs.ensureDir(path.join(dist, 'OPS', 'stylesheets'))
  await fs.ensureDir(path.join(dist, 'OPS', 'javascripts'))
}

const page = (dist) =>
  fs.readFile(path.join(dist, 'OPS', 'text', 'one.xhtml'), 'utf8')

describe('per-build config sections', () => {
  // Ignored from 6f2dfa3d (2019, "Persist config object", #285), which
  // removed the build command's merge, until TASK-163 resolved each build's
  // config in its own context. Here the `epub:` section makes the epub build
  // private.
  test("a build's own section overrides the base config", async () => {
    project = await createProject({ build: 'epub', chdir: true })
    await fs.writeFile(
      path.join(project.root, 'config.yml'),
      YamlAdaptor.dump({ private: false, epub: { private: true } })
    )
    const context = createBuildContext(loadProject(project.root), 'epub')
    await robots(context.settings.dist)

    await runInBuildContext(context, () => inject(context))

    expect(context.config.private).toBe(true)
    expect(await page(context.settings.dist)).toContain(
      '<meta name="robots" content="noindex,nofollow"/>'
    )
  })

  test("another build's section does not apply", async () => {
    project = await createProject({ build: 'web', chdir: true })
    await fs.writeFile(
      path.join(project.root, 'config.yml'),
      YamlAdaptor.dump({ private: false, epub: { private: true } })
    )
    const context = createBuildContext(loadProject(project.root), 'web')
    await robots(context.settings.dist)

    await runInBuildContext(context, () => inject(context))

    expect(context.config.private).toBe(false)
    expect(await page(context.settings.dist)).toContain(
      '<meta name="robots" content="index,follow"/>'
    )
  })

  test('a CLI override wins over the section', async () => {
    project = await createProject({ build: 'epub', chdir: true })
    await fs.writeFile(
      path.join(project.root, 'config.yml'),
      YamlAdaptor.dump({ private: false, epub: { private: true } })
    )
    const context = createBuildContext(
      loadProject(project.root, { private: false }),
      'epub'
    )

    expect(context.config.private).toBe(false)
  })
})
