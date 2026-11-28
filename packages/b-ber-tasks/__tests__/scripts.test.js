import path from 'node:path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import scripts from '../src/scripts'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

let project
const { NODE_ENV } = process.env

beforeEach(() => returnReportedErrors(log))

afterEach(async () => {
  process.env.NODE_ENV = NODE_ENV
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

const setup = async (files) => {
  project = await createProject()
  await Promise.all(
    Object.entries(files).map(([name, body]) =>
      fs.outputFile(path.join(project.src, '_javascripts', name), body)
    )
  )
}

const out = (...args) => path.join(project.dist, 'OPS', 'javascripts', ...args)

describe('task: scripts', () => {
  test('copies each script as it is outside production', async () => {
    process.env.NODE_ENV = 'development'
    const a = 'function a() {\n  return 1\n}\n'
    await setup({ 'a.js': a, 'b.js': 'var b = 2\n', 'notes.txt': 'x' })

    await scripts(project.ctx)

    expect((await fs.readdir(out())).sort()).toEqual(['a.js', 'b.js'])
    expect(await fs.readFile(out('a.js'), 'utf8')).toBe(a)
  })

  test('joins and minifies the scripts into <hash>.js in production', async () => {
    process.env.NODE_ENV = 'production'
    await setup({
      'a.js': 'var first = 1;\n',
      'b.js': 'if (false) { dead() }\nvar second = 2;\n',
      'notes.txt': 'x',
    })

    await scripts(project.ctx)

    expect(await fs.readdir(out())).toEqual([`${state.hash}.js`])
    const js = await fs.readFile(out(`${state.hash}.js`), 'utf8')
    expect(js).toBe('var first=1,second=2;')
  })

  test('writes an empty directory when there are no scripts', async () => {
    process.env.NODE_ENV = 'development'
    await setup({})
    await fs.ensureDir(path.join(project.src, '_javascripts'))

    await scripts(project.ctx)

    expect(await fs.readdir(out())).toEqual([])
  })

  test('rejects, through log.error, when a script does not parse in production', async () => {
    process.env.NODE_ENV = 'production'
    await setup({ 'a.js': 'var = ;' })

    await expect(scripts(project.ctx)).rejects.toMatchObject({
      name: 'SyntaxError',
    })
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'SyntaxError' })
    )
  })

  test('rejects, through log.error, when _javascripts does not exist', async () => {
    await setup({})

    await expect(scripts(project.ctx)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
  })
})
