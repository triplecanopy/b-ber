import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import validate from '../src/validate'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

// The task prints its report to stdout, which is silenced and read here
let project

beforeEach(() => {
  returnReportedErrors(log)
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
})

afterEach(async () => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

const VALID = 'Text\n\n::: chapter:a\n\nMore\n\n::: exit:a\n'
// `exit:b` closes a directive that is not open, and `chapter:a` is never
// closed: two warnings
const WARNINGS = 'Text\n\n::: chapter:a\n::: exit:b\n'
// The id is used twice: an error
const ERRORS = '::: chapter:a\n::: exit:a\n\n::: chapter:a\n::: exit:a\n'

const printed = () =>
  process.stdout.write.mock.calls.map(([text]) => text).join('')

describe('task: validate', () => {
  test('reports each valid file, then that the directives are valid', async () => {
    project = await createProject({ markdown: { one: VALID, two: 'Plain' } })

    await expect(validate({ project: project.root })).resolves.toEqual({
      files: 2,
      errors: 0,
      warnings: 0,
    })

    expect(log.info).toHaveBeenCalledWith('Directives valid %s', 'one.md')
    expect(log.info).toHaveBeenCalledWith('Directives valid %s', 'two.md')
    expect(log.notice).toHaveBeenCalledWith('Directives valid in %d files', 2)
    expect(printed()).toBe('')
  })

  test('prints each diagnostic where it is, and counts them', async () => {
    project = await createProject({ markdown: { one: VALID, bad: WARNINGS } })

    await expect(validate({ project: project.root })).resolves.toEqual({
      files: 2,
      errors: 0,
      warnings: 2,
    })

    expect(printed()).toBe(
      [
        '_markdown/bad.md:3:1 - warning unclosed-block: `chapter:a` is never closed; it ends at the end of the file',
        '  3 | ::: chapter:a',
        '    | ^^^^^^^^^^^^^',
        '  note: Add `::: exit:a`',
        '',
        '_markdown/bad.md:4:1 - warning unmatched-exit: `exit:b` matches no open block',
        '  4 | ::: exit:b',
        '    | ^^^^^^^^^^',
        '  note: _markdown/bad.md:3:1: `chapter:a` is open here',
        '  3 | ::: chapter:a',
        '    | ^^^^^^^^^^^^^',
        '',
        '',
      ].join('\n')
    )
    expect(log.info).toHaveBeenCalledWith('Directives valid %s', 'one.md')
    expect(log.notice).toHaveBeenCalledWith(
      '%d errors and %d warnings in %d files',
      0,
      2,
      2
    )
  })

  test('counts errors apart from warnings', async () => {
    project = await createProject({ markdown: { bad: ERRORS } })

    await expect(validate({ project: project.root })).resolves.toEqual({
      files: 1,
      errors: 1,
      warnings: 0,
    })
    expect(printed()).toContain(
      '_markdown/bad.md:4:13 - error duplicate-id: The id `a` is already used'
    )
  })

  test('reads only Markdown files', async () => {
    project = await createProject({ markdown: { one: VALID } })
    await fs.writeFile(
      path.join(project.src, '_markdown', 'notes.txt'),
      WARNINGS
    )

    await validate({ project: project.root })

    expect(log.notice).toHaveBeenCalledWith('Directives valid in %d files', 1)
  })

  // Defect: invalid directives are printed, and the task still resolves, so
  // `bber check` exits 0 on a project with errors and cannot fail a CI run
  test('resolves when files are invalid (defect)', async () => {
    project = await createProject({ markdown: { bad: ERRORS } })

    await expect(validate({ project: project.root })).resolves.toMatchObject({
      errors: 1,
    })
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

  // #797: b-ber-validator's own grammar read a directive only after a
  // newline, so a file opening with a closed block failed and one opening an
  // unclosed block passed. The check is the build's parse now
  test('reads a directive on the first line of a file', async () => {
    project = await createProject({
      markdown: {
        closed: '::: chapter:a\n\n::: exit:a\n',
        unclosed: '::: chapter:a\n',
      },
    })

    await validate({ project: project.root })

    expect(log.info).toHaveBeenCalledWith('Directives valid %s', 'closed.md')
    expect(printed()).toBe(
      [
        '_markdown/unclosed.md:1:1 - warning unclosed-block: `chapter:a` is never closed; it ends at the end of the file',
        '  1 | ::: chapter:a',
        '    | ^^^^^^^^^^^^^',
        '  note: Add `::: exit:a`',
        '',
        '',
      ].join('\n')
    )
  })
})
