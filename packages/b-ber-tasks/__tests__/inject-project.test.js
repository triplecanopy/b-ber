// The inject task against a real temp project. inject.test.js mocks fs and
// State to test `getFileObjects` alone; these run the task itself.

import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import inject from '../src/inject'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

let project

beforeEach(() => returnReportedErrors(log))

afterEach(async () => {
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

const ops = (...args) => path.join(project.dist, 'OPS', ...args)

// A build as far as the inject step: rendered pages, compiled styles and
// copied scripts
const setup = async ({
  text = {},
  stylesheets = [],
  javascripts = [],
  config,
}) => {
  project = await createProject({ config })
  await fs.ensureDir(ops('stylesheets'))
  await fs.ensureDir(ops('javascripts'))
  await Promise.all([
    ...Object.entries(text).map(([name, body]) =>
      fs.outputFile(ops('text', name), body)
    ),
    ...stylesheets.map((name) => fs.outputFile(ops('stylesheets', name), '')),
    ...javascripts.map((name) => fs.outputFile(ops('javascripts', name), '')),
  ])
}

const read = (name) => fs.readFile(ops('text', name), 'utf8')

describe('task: inject', () => {
  test('wraps each page in the document head and tail', async () => {
    await setup({
      text: { 'one.xhtml': '<p>One</p>', 'two.xhtml': '<p>Two</p>' },
    })

    await inject()

    const one = await read('one.xhtml')
    expect(one).toStartWith('<?xml')
    expect(one).toContain('<p>One</p>')
    expect(one).toEndWith('</body></html>')
    expect(await read('two.xhtml')).toContain('<p>Two</p>')
  })

  test('links the stylesheets in the head and the scripts in the tail', async () => {
    await setup({
      text: { 'one.xhtml': '<p>One</p>' },
      stylesheets: ['application.css'],
      javascripts: ['application.js'],
    })

    await inject()

    const [head, tail] = (await read('one.xhtml')).split('<p>One</p>')
    expect(head).toContain(
      '<link rel="stylesheet" type="text/css" href="../stylesheets/application.css"/>'
    )
    expect(tail).toContain(
      '<script type="application/javascript" src="../javascripts/application.js"></script>'
    )
  })

  test('tells the page scripts which build they are in', async () => {
    await setup({ text: { 'one.xhtml': '' } })

    await inject()

    expect(await read('one.xhtml')).toContain(
      '<script type="application/javascript">window.bber = window.bber || {}; window.bber.env = \'epub\';</script>'
    )
  })

  test('marks the pages noindex when the project is private', async () => {
    await setup({ text: { 'one.xhtml': '' }, config: { private: true } })

    await inject()

    expect(await read('one.xhtml')).toContain(
      '<meta name="robots" content="noindex,nofollow"/>'
    )
  })

  test('rejects when the build has no text directory', async () => {
    await setup({})

    await expect(inject()).rejects.toMatchObject({ code: 'ENOENT' })
  })

  test('rejects when the build has no stylesheets directory', async () => {
    await setup({ text: { 'one.xhtml': '' } })
    await fs.remove(ops('stylesheets'))

    await expect(inject()).rejects.toMatchObject({ code: 'ENOENT' })
  })

  // Defect: `remote_stylesheets` and `remote_javascripts` are joined onto the
  // local directory like file names (src/inject/index.ts:58, 73), so a URL
  // comes out as a broken relative path: `path.join` collapses its `//`.
  test('links a remote stylesheet as a local path (defect)', async () => {
    await setup({
      text: { 'one.xhtml': '' },
      config: {
        remote_stylesheets: ['https://example.com/a.css'],
        remote_javascripts: ['https://example.com/a.js'],
      },
    })

    await inject()

    const page = await read('one.xhtml')
    expect(page).toContain('href="../stylesheets/https:/example.com/a.css"')
    expect(page).toContain('src="../javascripts/https:/example.com/a.js"')
    expect(page).not.toContain('https://example.com')
  })
})
