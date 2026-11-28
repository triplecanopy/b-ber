import container from '../src/container'

const mockFsMkdirs = jest.fn().mockResolvedValue(undefined)
const mockFsWriteFile = jest.fn().mockResolvedValue(undefined)

jest.mock('fs-extra', () => ({
  mkdirs: (...args) => mockFsMkdirs(...args),
  writeFile: (...args) => mockFsWriteFile(...args),
}))

// The build's context: building into `/builds/epub`
const ctx = { settings: { dist: '/builds/epub' } }

jest.mock('@canopycanopycanopy/b-ber-logger')

beforeEach(() => {
  mockFsMkdirs.mockClear()
  mockFsWriteFile.mockClear()
})

describe('task: container', () => {
  test('creates the ops and META-INF directories', async () => {
    await container(ctx)
    const createdDirs = mockFsMkdirs.mock.calls.map(([p]) => p)
    expect(createdDirs).toContain('/builds/epub/OPS')
    expect(createdDirs.some((p) => p.includes('META-INF'))).toBe(true)
  })

  test('writes container.xml to META-INF/', async () => {
    await container(ctx)
    const writtenPaths = mockFsWriteFile.mock.calls.map(([p]) => p)
    expect(writtenPaths.some((p) => p.includes('container.xml'))).toBe(true)
  })

  test('writes a mimetype file', async () => {
    await container(ctx)
    const writtenPaths = mockFsWriteFile.mock.calls.map(([p]) => p)
    expect(writtenPaths.some((p) => p.includes('mimetype'))).toBe(true)
  })

  test('returns a promise', () => {
    expect(container(ctx)).toBeInstanceOf(Promise)
  })
})
