import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import validate from '../src/validate'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

// The task's only output is what it logs. b-ber-validator's `report` prints a
// failure with console.log, which is silenced and read here.
let project

beforeEach(() => {
  returnReportedErrors(log)
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(async () => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

// Neither starts with a directive: see the defect test at the end
const VALID = 'Text\n\n::: chapter:a\n\nMore\n\n::: exit:a\n'
// `exit:b` closes a directive that is not open
const INVALID = 'Text\n\n::: chapter:a\n::: exit:b\n'

const printed = () => console.log.mock.calls.map((args) => args.join(' '))

describe('task: validate', () => {
  test('reports each valid file, then that the directives are valid', async () => {
    project = await createProject({ markdown: { one: VALID, two: 'Plain' } })

    await validate({ project: project.root })

    expect(log.info).toHaveBeenCalledWith('Syntax valid %s', 'one.md')
    expect(log.info).toHaveBeenCalledWith('Syntax valid %s', 'two.md')
    expect(log.info).toHaveBeenCalledWith('Directives valid')
    expect(printed()).toEqual([])
  })

  test('prints where an invalid file goes wrong', async () => {
    project = await createProject({ markdown: { one: VALID, bad: INVALID } })

    await validate({ project: project.root })

    expect(printed()).toContainEqual(expect.stringContaining('Error in bad.md'))
    expect(printed()).toContainEqual(
      'Expected Closing identifier to match opening identifier a'
    )
    expect(printed()).toContainEqual('On line 4')
    expect(log.info).toHaveBeenCalledWith('Syntax valid %s', 'one.md')
    expect(log.info).not.toHaveBeenCalledWith('Directives valid')
  })

  test('reads only Markdown files', async () => {
    project = await createProject({ markdown: { one: VALID } })
    await fs.writeFile(
      path.join(project.src, '_markdown', 'notes.txt'),
      INVALID
    )

    await validate({ project: project.root })

    expect(log.info).toHaveBeenCalledWith('Directives valid')
  })

  // Defect: invalid directives are printed, and the task still resolves,
  // with nothing (src/validate/index.ts:41). `bber check` exits 0 on a
  // project with errors, so it cannot fail a CI run.
  test('resolves when files are invalid (defect)', async () => {
    project = await createProject({ markdown: { bad: INVALID } })

    await expect(validate({ project: project.root })).resolves.toBeUndefined()
  })

  // Defect (#736): the missing-project check tests `fs.pathExists`'s promise,
  // which is always truthy, so it never fires: the task rejects from readdir
  // instead of reporting "Project path does not exist".
  test('rejects from readdir for a missing project (defect)', async () => {
    project = await createProject()
    await fs.remove(path.join(project.src, '_markdown'))

    await expect(validate({ project: project.root })).rejects.toMatchObject({
      code: 'ENOENT',
    })
    expect(log.error).not.toHaveBeenCalled()
  })

  // Defect, in b-ber-validator: a directive on a file's first line is not
  // parsed as one, since the parser looks for a directive after a newline. A
  // file that opens with a correctly closed directive fails, and one that
  // opens a directive and never closes it passes. Files that begin with front
  // matter, as `bber generate` writes them, are not affected.
  test('misreads a directive on the first line of a file (defect)', async () => {
    project = await createProject({
      markdown: {
        closed: '::: chapter:a\n\n::: exit:a\n',
        unclosed: '::: chapter:a\n',
      },
    })

    await validate({ project: project.root })

    expect(printed()).toContainEqual(
      expect.stringContaining('Error in closed.md')
    )
    expect(log.info).toHaveBeenCalledWith('Syntax valid %s', 'unclosed.md')
  })
})
