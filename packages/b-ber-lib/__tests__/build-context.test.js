// loadProject, config layering, BuildContext and State's shim over it
// (TASK-163). Each test runs in a real temporary project, because State and
// the loaders read relative to the working directory.

import os from 'node:os'
import path from 'node:path'
import { setImmediate as nextTurn } from 'node:timers/promises'
import fs from 'fs-extra'
import {
  createBuildContext,
  currentBuildContext,
  runBuild,
} from '../src/BuildContext'
import { loadProject, mergeConfig, resolveConfig } from '../src/Project'

jest.mock('@canopycanopycanopy/b-ber-logger')

const cwd = process.cwd()
let root

const writeProject = async (dir, { config = {}, src = '_project' } = {}) => {
  const yaml = Object.entries({ src, dist: 'project', ...config })
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n')
  await fs.outputFile(path.join(dir, 'config.yml'), `${yaml}\n`)
  await fs.outputFile(path.join(dir, src, 'toc.yml'), '[]\n')
  await fs.outputFile(
    path.join(dir, src, 'metadata.yml'),
    `- term: title\n  value: ${src} title\n`
  )
  await fs.ensureDir(path.join(dir, src, '_markdown'))
}

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'bber-context-'))
  process.chdir(root)
})

afterEach(async () => {
  process.chdir(cwd)
  await fs.remove(root)
})

describe('mergeConfig', () => {
  it('merges objects key by key and replaces everything else', () => {
    const base = {
      a: 1,
      list: ['x', 'y', 'z'],
      nested: { keep: true, change: 1 },
    }
    expect(
      mergeConfig(base, { list: ['only'], nested: { change: 2 } })
    ).toEqual({
      a: 1,
      list: ['only'],
      nested: { keep: true, change: 2 },
    })
  })

  it('does not pad a shorter array with the base entries', () => {
    // lodash's defaultsDeep and merge do (TASK-162, audit bug 3)
    expect(mergeConfig({ l: ['a', 'b', 'c'] }, { l: ['z'] }).l).toEqual(['z'])
  })

  it('leaves a key alone when the override is undefined', () => {
    expect(mergeConfig({ a: 1 }, { a: undefined })).toEqual({ a: 1 })
  })

  it('does not change its arguments', () => {
    const base = { nested: { a: 1 } }
    mergeConfig(base, { nested: { a: 2 } })
    expect(base).toEqual({ nested: { a: 1 } })
  })
})

describe('resolveConfig', () => {
  const config = { private: false, theme: 'x', epub: { private: true } }

  it("applies the target's own section over config.yml", () => {
    expect(resolveConfig(config, 'epub').private).toBe(true)
    expect(resolveConfig(config, 'web').private).toBe(false)
  })

  it('applies the overrides last, over the section', () => {
    expect(resolveConfig(config, 'epub', { private: false }).private).toBe(
      false
    )
  })
})

describe('loadProject', () => {
  it('reads config.yml, metadata.yml and the theme', async () => {
    await writeProject(root)
    const project = loadProject(root)

    expect(project.config.src).toBe('_project')
    expect(project.metadata.json()).toEqual([
      { term: 'title', value: '_project title' },
    ])
    expect(project.theme.name).toBe('b-ber-theme-serif')
  })

  it('applies the overrides before it reads anything', async () => {
    // `--theme` and `--src` used to arrive after State had loaded both
    // (TASK-162, audit bug 1)
    await writeProject(root)
    await writeProject(root, { src: 'content' })
    await fs.outputFile(
      path.join(root, 'config.yml'),
      'src: _project\ndist: project\n'
    )

    const project = loadProject(root, {
      src: 'content',
      theme: 'b-ber-theme-sans',
    })

    expect(project.metadata.json()[0].value).toBe('content title')
    expect(project.theme.name).toBe('b-ber-theme-sans')
    // config.yml itself is kept as it was read
    expect(project.config.src).toBe('_project')
  })
})

describe('createBuildContext', () => {
  it("builds into the target's directory under the resolved dist", async () => {
    await writeProject(root)
    const project = loadProject(root, { dist: 'out' })
    const context = createBuildContext(project, 'epub')

    expect(context.target).toBe('epub')
    expect(context.config.dist).toBe('out')
    expect(context.settings.dist).toBe('out-epub')
  })

  it('gives every context its own hash and collections', async () => {
    await writeProject(root)
    const project = loadProject(root)
    const a = createBuildContext(project, 'epub')
    const b = createBuildContext(project, 'epub')

    expect(a.hash).not.toBe(b.hash)
    expect(a.settings.figures).not.toBe(b.settings.figures)
  })
})

describe('State inside a BuildContext', () => {
  let state

  beforeEach(() =>
    writeProject(root, { config: { private: false, epub: { private: true } } })
  )

  // A fresh State per test. State and BuildContext must share one
  // AsyncLocalStorage, so both come from the same isolated registry
  const isolatedContext = () => {
    const api = {}
    jest.isolateModules(() => {
      /* eslint-disable global-require */
      state = require('../src/State').default
      const context = require('../src/BuildContext')
      api.createBuildContext = context.createBuildContext
      api.runInBuildContext = context.runInBuildContext
      api.currentBuildContext = context.currentBuildContext
      api.loadProject = require('../src/Project').loadProject
      /* eslint-enable global-require */
    })
    return api
  }

  it('reads the build, its config and its paths from the context', async () => {
    const api = isolatedContext()
    const context = api.createBuildContext(api.loadProject(root), 'epub')

    await api.runInBuildContext(context, async () => {
      expect(state.build).toBe('epub')
      // The `epub:` section applies: ignored since 2019 until TASK-163
      expect(state.config.private).toBe(true)
      expect(state.distDir).toBe('project-epub')
      expect(state.dist.text('a.xhtml')).toBe(
        path.join('project-epub', 'OPS', 'text', 'a.xhtml')
      )
    })
  })

  it("writes a build's collections to its context, not the instance", async () => {
    const api = isolatedContext()
    const context = api.createBuildContext(api.loadProject(root), 'web')

    await api.runInBuildContext(context, async () => {
      state.add('figures', { id: 'f1' })
      state.update('loi', ['page'])
    })

    expect(context.settings.figures).toEqual([{ id: 'f1' }])
    expect(context.settings.loi).toEqual(['page'])
    expect(api.currentBuildContext()).toBeUndefined()
  })

  it('keeps two interleaved builds apart', async () => {
    const api = isolatedContext()
    const project = api.loadProject(root)
    const seen = { epub: [], web: [] }

    const build = (target) => {
      const context = api.createBuildContext(project, target)
      // Three steps, handing the event loop to the other build after each
      const step = (i) => async () => {
        state.add('figures', `${target}-${i}`)
        await nextTurn()
        seen[target].push([
          state.build,
          state.config.private,
          state.figures.length,
        ])
      }
      return api.runInBuildContext(context, () =>
        [0, 1, 2]
          .reduce((chain, i) => chain.then(step(i)), Promise.resolve())
          .then(() => context)
      )
    }

    const [epub, web] = await Promise.all([build('epub'), build('web')])

    expect(seen.epub).toEqual([
      ['epub', true, 1],
      ['epub', true, 2],
      ['epub', true, 3],
    ])
    expect(seen.web).toEqual([
      ['web', false, 1],
      ['web', false, 2],
      ['web', false, 3],
    ])
    expect(epub.settings.figures).toEqual(['epub-0', 'epub-1', 'epub-2'])
    expect(web.settings.figures).toEqual(['web-0', 'web-1', 'web-2'])
  })

  it('resets a build without changing which target is building', async () => {
    const api = isolatedContext()
    const context = api.createBuildContext(api.loadProject(root), 'epub')
    const { hash } = context

    await api.runInBuildContext(context, async () => {
      state.update('config.private', false)
      state.reset()
      expect(state.build).toBe('epub')
      expect(state.config.private).toBe(true)
    })
    expect(context.hash).not.toBe(hash)
  })
})

describe('runBuild', () => {
  it('builds each target in turn, each in its own context', async () => {
    await writeProject(root)
    const project = loadProject(root)
    const order = []

    await runBuild(project, ['epub', 'web'], async (context) => {
      order.push(`start ${context.target}`)
      expect(currentBuildContext()).toBe(context)
      await nextTurn()
      order.push(`end ${context.target}`)
    })

    expect(order).toEqual(['start epub', 'end epub', 'start web', 'end web'])
  })

  it('stops at the first failure', async () => {
    await writeProject(root)
    const project = loadProject(root)
    const built = []

    await expect(
      runBuild(project, ['epub', 'web'], async (context) => {
        built.push(context.target)
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')
    expect(built).toEqual(['epub'])
  })
})

describe('importing State', () => {
  const { argv } = process
  afterEach(() => {
    process.argv = argv
  })

  it('reads and writes nothing until it is used', async () => {
    await writeProject(root)
    // State loads its theme only for a command that works in a project
    process.argv = [argv[0], 'bber', 'build']
    let state
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require
      state = require('../src/State').default
    })

    // State's theme loader creates the themes directory, so it is the sign
    // that the project has been loaded
    expect(fs.existsSync(path.join(root, 'themes'))).toBe(false)

    expect(state.config.src).toBe('_project')
    expect(fs.existsSync(path.join(root, 'themes'))).toBe(true)
  })
})
