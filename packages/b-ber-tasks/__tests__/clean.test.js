import clean from '../src/clean'

const mockFsRemove = jest.fn().mockResolvedValue(undefined)
const mockFsReaddirSync = jest
  .fn()
  .mockReturnValue(['publication.epub', 'publication.mobi', 'output'])

jest.mock('fs-extra', () => ({
  readdirSync: (...args) => mockFsReaddirSync(...args),
  remove: (...args) => mockFsRemove(...args),
}))

// The build's context: the epub target, building into `/project/builds/epub`
const ctx = {
  target: { name: 'epub' },
  settings: { dist: '/project/builds/epub' },
}

jest.mock('@canopycanopycanopy/b-ber-logger')

beforeEach(() => {
  mockFsRemove.mockClear()
  mockFsReaddirSync.mockClear()
})

describe('task: clean', () => {
  test('reads the parent directory of distDir', async () => {
    await clean(ctx)
    expect(mockFsReaddirSync).toHaveBeenCalledWith('/project/builds')
  })

  test('removes files matching the build extension', async () => {
    await clean(ctx)
    expect(mockFsRemove).toHaveBeenCalledWith(
      '/project/builds/publication.epub'
    )
  })

  test('does not remove files with a different extension', async () => {
    await clean(ctx)
    const removedPaths = mockFsRemove.mock.calls.map(([p]) => p)
    expect(removedPaths).not.toContain('/project/builds/publication.mobi')
  })

  test('does not remove files with no extension', async () => {
    await clean(ctx)
    const removedPaths = mockFsRemove.mock.calls.map(([p]) => p)
    expect(removedPaths).not.toContain('/project/builds/output')
  })

  test('removes distDir after removing artifact files', async () => {
    await clean(ctx)
    const removedPaths = mockFsRemove.mock.calls.map(([p]) => p)
    expect(removedPaths).toContain('/project/builds/epub')
  })

  test('returns a promise', () => {
    expect(clean(ctx)).toBeInstanceOf(Promise)
  })
})
