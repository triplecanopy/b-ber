import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import zipper from 'epub-zipper'
import epub from '../src/epub'
import { createProject } from './helpers/project'

// epub-zipper writes the archive into process.cwd(), which is the repo root
// under Jest, so it is replaced. What the task decides is what it asks for.
jest.mock('epub-zipper', () => ({ create: jest.fn() }))
jest.mock('@canopycanopycanopy/b-ber-logger')

let project
const { argv } = process

beforeEach(async () => {
  zipper.create.mockResolvedValue(undefined)
  project = await createProject({
    metadata: [{ term: 'identifier', value: 'book-id' }],
  })
})

afterEach(async () => {
  process.argv = argv
  jest.clearAllMocks()
  await project.cleanup()
})

describe('task: epub', () => {
  test('zips the build directory, named for the book identifier', async () => {
    await epub()

    expect(zipper.create).toHaveBeenCalledTimes(1)
    expect(zipper.create).toHaveBeenCalledWith({
      input: project.dist,
      output: process.cwd(),
      clean: true,
      fileName: 'book-id',
    })
  })

  test('does nothing with --no-compile', async () => {
    process.argv = [...argv, '--no-compile']

    await expect(epub()).resolves.toBeUndefined()
    expect(zipper.create).not.toHaveBeenCalled()
  })

  test('passes a zipper failure to log.error', async () => {
    const err = new Error('zip failed')
    zipper.create.mockRejectedValue(err)

    await epub()

    expect(log.error).toHaveBeenCalledWith(err)
  })

  test('names the archive with an empty string when there is no identifier', async () => {
    // Restored by project.cleanup
    state.metadata = { json: () => [] }

    await epub()

    expect(zipper.create).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: '' })
    )
    expect(log.warn).toHaveBeenCalledWith(
      'Could not find metadata value for identifier'
    )
  })
})
