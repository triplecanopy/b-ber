import path from 'node:path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import { create } from 'browser-sync'
import serialize from '../src/serialize'
import serve from '../src/serve'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

// Two boundaries are mocked. browser-sync is the server process. `serialize`
// runs a build's whole task sequence, which every other test file covers task
// by task; here it records the build it was asked for and the config that
// build would see.
jest.mock('../src/serialize', () => jest.fn())

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

// A project for the build the test serves. Its cleanup puts State back
const setup = async (build) => {
  project = await createProject({ build })
}

beforeEach(() => {
  builds = []
  serialize.mockImplementation((sequence) => {
    const { base_url, base_path, remote_url, reader_url } = state.config
    builds.push({
      sequence,
      build: state.build,
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
      server: { baseDir: path.resolve('project-reader') },
    })
    expect(builds).toHaveLength(1)
    expect(builds[0].sequence).toBe(sequences.reader)
  })

  test('builds the build asked for, for the local server URL', async () => {
    await setup('web')
    await serve({ build: 'web' })

    expect(initOptions().server.baseDir).toBe(path.resolve('project-web'))
    expect(builds[0]).toEqual({
      sequence: sequences.web,
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
  })

  // Defect: the server root and the watched files are fixed paths
  // (src/serve/index.ts:38, 71): `project-<build>` and `_project/`, resolved
  // against the working directory. The watched paths are worked out when the
  // module is imported. A project whose config.yml sets `src` or `dist` is
  // served from, and watched in, directories that do not exist.
  test('serves and watches the default directories, ignoring src and dist (defect)', async () => {
    await setup('web')
    state.config.src = 'book'
    state.config.dist = 'out'

    await serve({ build: 'web' })

    expect(initOptions().server.baseDir).toBe(path.resolve('project-web'))
    expect(initOptions().files[0].match).toEqual([
      path.resolve('_project', '**', '*.scss'),
      path.resolve('_project', '**', '*.js'),
      path.resolve('_project', '**', '*.md'),
    ])
  })
})
