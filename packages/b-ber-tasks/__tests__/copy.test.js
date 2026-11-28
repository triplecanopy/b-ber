import copy from '../src/copy'

const mockFsMkdirp = jest.fn().mockResolvedValue(undefined)
const mockFsCopy = jest.fn().mockResolvedValue(undefined)
const mockFsReaddir = jest.fn().mockResolvedValue([])
const mockFsStatSync = jest.fn().mockReturnValue({ size: 100 })

jest.mock('fs-extra', () => ({
  mkdirp: (...args) => mockFsMkdirp(...args),
  copy: (...args) => mockFsCopy(...args),
  readdir: (...args) => mockFsReaddir(...args),
  statSync: (...args) => mockFsStatSync(...args),
}))

// The build's context: the source in `/src`, building into `/dist`, so the
// assets go to `/dist/OPS/<images|fonts|media>`
const ctx = { config: { ignore: [], src: '/src' }, settings: { dist: '/dist' } }

jest.mock('@canopycanopycanopy/b-ber-logger')

beforeEach(() => {
  mockFsMkdirp.mockClear()
  mockFsCopy.mockClear()
  mockFsReaddir.mockClear()
  mockFsStatSync.mockClear()
})

describe('task: copy', () => {
  test('returns a promise', () => {
    expect(copy(ctx)).toBeInstanceOf(Promise)
  })

  test('creates destination directories via mkdirp', async () => {
    await copy(ctx)
    const dirs = mockFsMkdirp.mock.calls.map(([p]) => p)
    expect(dirs.some((p) => p.includes('dist/OPS/images'))).toBe(true)
    expect(dirs.some((p) => p.includes('dist/OPS/fonts'))).toBe(true)
    expect(dirs.some((p) => p.includes('dist/OPS/media'))).toBe(true)
  })

  test('creates source directories via mkdirp to ensure they exist', async () => {
    await copy(ctx)
    const dirs = mockFsMkdirp.mock.calls.map(([p]) => p)
    expect(dirs.some((p) => p.includes('src/_images'))).toBe(true)
    expect(dirs.some((p) => p.includes('src/_fonts'))).toBe(true)
    expect(dirs.some((p) => p.includes('src/_media'))).toBe(true)
  })

  test('copies each asset directory from src to dist', async () => {
    await copy(ctx)
    expect(mockFsCopy).toHaveBeenCalledTimes(3)
    const pairs = mockFsCopy.mock.calls.map(([from, to]) => ({ from, to }))
    expect(
      pairs.some((p) => p.from.includes('_images') && p.to.includes('images'))
    ).toBe(true)
    expect(
      pairs.some((p) => p.from.includes('_fonts') && p.to.includes('fonts'))
    ).toBe(true)
    expect(
      pairs.some((p) => p.from.includes('_media') && p.to.includes('media'))
    ).toBe(true)
  })

  test('passes overwrite: false to fs.copy', async () => {
    await copy(ctx)
    const [, , opts] = mockFsCopy.mock.calls[0]
    expect(opts.overwrite).toBe(false)
  })

  test('filter excludes dot files', async () => {
    await copy(ctx)
    const [, , { filter }] = mockFsCopy.mock.calls[0]
    expect(filter('.hidden')).toBe(false)
    expect(filter('.gitkeep')).toBe(false)
    expect(filter('image.jpg')).toBe(true)
  })

  test('resolves without error when files exceed the size warning limit', async () => {
    mockFsReaddir.mockResolvedValue(['large-video.mp4'])
    mockFsStatSync.mockReturnValue({ size: 2000000 }) // over 1.5Mb limit
    await expect(copy(ctx)).resolves.not.toThrow()
  })
})
