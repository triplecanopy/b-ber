import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import { create } from 'browser-sync'
import fs from 'fs-extra'
import serve from '../src/serve'
import { build } from '../src/targets'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

// Two boundaries are mocked. browser-sync is the server process. `build`
// runs a target's whole build, which every other test file covers task by
// task; here it records the target and the config of the context it was
// given.
jest.mock('../src/targets', () => ({ build: jest.fn() }))

// The task creates its server when it is imported, so the fake is built in
// the factory, and `create` hands every caller the same one
jest.mock('browser-sync', () => {
  const browserSync = {
    init: jest.fn(),
    getOption: jest.fn(),
    reload: jest.fn(),
    instance: {
      options: { the: 'options' },
      setOption: jest.fn(),
      utils: { openBrowser: jest.fn() },
    },
  }
  return { create: () => browserSync }
})

const mockBrowserSync = create()

const URLS = {
  local: 'http://localhost:4000',
  external: 'http://10.0.0.2:4000',
}

let builds
let project

// A project for the build the test serves, in the working directory, where
// serve reads it from. Its cleanup puts the directory back
const setup = async (target, options = {}) => {
  project = await createProject({ build: target, chdir: true, ...options })
}

beforeEach(() => {
  builds = []
  build.mockImplementation((ctx) => {
    const { base_url, base_path, remote_url, reader_url } = ctx.config
    builds.push({
      build: ctx.target.name,
      config: { base_url, base_path, remote_url, reader_url },
    })
    return Promise.resolve()
  })
  mockBrowserSync.init.mockImplementation((_options, cb) => cb())
  mockBrowserSync.getOption.mockImplementation((name) =>
    name === 'urls' ? new Map(Object.entries(URLS)) : undefined
  )
})

afterEach(async () => {
  jest.useRealTimers()
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

const initOptions = () => mockBrowserSync.init.mock.calls[0][0]

describe('task: serve', () => {
  test('serves the reader build by default, on port 4000', async () => {
    await setup('reader')
    await serve({})

    expect(initOptions()).toMatchObject({
      port: 4000,
      open: false,
      server: { baseDir: path.resolve(project.dist) },
    })
    expect(builds).toHaveLength(1)
    expect(builds[0].build).toBe('reader')
    // #743: it used to say `b-ber-undefined`
    expect(log.notice).toHaveBeenCalledWith('Serving [b-ber-reader]')
  })

  test('builds the build asked for, for the local server URL', async () => {
    await setup('web')
    await serve({ build: 'web' })

    expect(initOptions().server.baseDir).toBe(path.resolve(project.dist))
    expect(builds[0]).toEqual({
      build: 'web',
      config: {
        base_url: '/',
        base_path: '/',
        remote_url: URLS.local,
        reader_url: URLS.local,
      },
    })
  })

  test('opens the browser once the build is done', async () => {
    await setup('web')
    await serve({ build: 'web' })

    const { instance } = mockBrowserSync
    expect(instance.setOption).toHaveBeenCalledWith('open', 'local')
    expect(instance.utils.openBrowser).toHaveBeenCalledWith(
      URLS.local,
      instance.options,
      instance
    )
  })

  test('uses the external URL with `external`', async () => {
    await setup('web')
    await serve({ build: 'web', external: true })

    expect(builds[0].config.remote_url).toBe(URLS.external)
    expect(mockBrowserSync.instance.setOption).toHaveBeenCalledWith(
      'open',
      'external'
    )
  })

  test('serves XHTML as HTML', async () => {
    await setup('reader')
    await serve({})
    const [middleware] = initOptions().server.middleware

    const res = { setHeader: jest.fn() }
    const next = jest.fn()
    middleware({ url: '/OPS/text/one.xhtml' }, res, next)
    middleware({ url: '/OPS/content.opf' }, res, next)

    expect(res.setHeader).toHaveBeenCalledTimes(1)
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/html; charset=UTF-8'
    )
    expect(next).toHaveBeenCalledTimes(2)
  })

  test('rebuilds and reloads once a burst of source changes settles', async () => {
    await setup('web')
    await serve({ build: 'web' })
    jest.useFakeTimers()
    const [{ fn: onChange }] = initOptions().files

    onChange()
    onChange()
    onChange()
    expect(builds).toHaveLength(1)

    // Debounced by half a second
    await jest.advanceTimersByTimeAsync(500)

    expect(builds).toHaveLength(2)
    expect(builds[1].build).toBe('web')
    expect(mockBrowserSync.reload).toHaveBeenCalledTimes(1)

    // A new context each time, so that the figures, footnotes and spine
    // entries a build collects do not carry over into the next. The serve
    // task used to rebuild in the one State and only emptied the footnotes
    const [[first], [second]] = build.mock.calls
    expect(second).not.toBe(first)
    expect(second.settings).not.toBe(first.settings)
  })

  // The server root and the watched files used to be fixed paths,
  // `project-<build>` and `_project/`, worked out when the module was
  // imported. A project whose config.yml set `src` or `dist` was served
  // from, and watched in, directories that did not exist
  test('serves the build directory and watches the source directory config.yml names', async () => {
    await setup('web')
    await fs.move(project.src, path.join(project.root, 'book'))
    await fs.writeFile('config.yml', 'src: book\ndist: out\n')
    const src = path.join(project.root, 'book')

    await serve({ build: 'web' })

    expect(initOptions().server.baseDir).toBe(
      path.join(project.root, 'out-web')
    )
    expect(initOptions().files[0].match).toEqual([
      path.join(src, '**', '*.scss'),
      path.join(src, '**', '*.js'),
      path.join(src, '**', '*.md'),
    ])
  })
})
