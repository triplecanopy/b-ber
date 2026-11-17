/**
 * @jest-environment node
 */

// Node, not the root run's jsdom: this task only ever runs in Node, and the
// fake aws process below finishes on setImmediate, which jsdom lacks.

import { EventEmitter } from 'node:events'
import os from 'node:os'
import path from 'node:path'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import fs from 'fs-extra'
import { returnReportedErrors } from './helpers/log'

jest.mock('@canopycanopycanopy/b-ber-logger')

// The process boundary: the aws CLI, and the terminal the confirmation is read
// from. Shared with the copies of the modules each test loads (below).
const mockExec = jest.fn()
const mockExecSync = jest.fn()
const mockCreateInterface = jest.fn()
jest.mock('node:child_process', () => ({
  exec: (...args) => mockExec(...args),
  execSync: (...args) => mockExecSync(...args),
}))
jest.mock('node:readline', () => ({
  createInterface: (...args) => mockCreateInterface(...args),
}))

const cwd = process.cwd()
const { env } = process
let root
let commands
let exitCodes

// The deploy task reads config.yml from the working directory it was
// imported in. The CLI imports it from the project, so each test imports a
// fresh copy from inside its own temp project.
const load = () => {
  let deploy
  let log
  jest.isolateModules(() => {
    deploy = require('../src/deploy').default
    log = require('@canopycanopycanopy/b-ber-logger').default
  })
  returnReportedErrors(log)
  return { deploy, log }
}

// A finished aws process: `close` with the code the test chose, after
// printing nothing
const fakeProcess = (code) => {
  const proc = new EventEmitter()
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  setImmediate(() => proc.emit('close', code))
  return proc
}

beforeEach(async () => {
  root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-deploy-'))
  )
  process.chdir(root)
  await fs.writeFile(
    'config.yml',
    YamlAdaptor.dump({ bucket_url: 's3://bucket/book' })
  )
  process.env = {
    ...env,
    AWS_ACCESS_KEY_ID: 'id',
    AWS_SECRET_ACCESS_KEY: 'secret',
    BBER_BUCKET_REGION: 'us-east-1',
  }

  commands = []
  exitCodes = []
  mockExec.mockImplementation((command) => {
    commands.push(command)
    return fakeProcess(exitCodes.shift() ?? 0)
  })
  jest.spyOn(console, 'log').mockImplementation(() => {})
  // A task should never exit the process; where it tries, the test sees it
  jest.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`)
  })
})

afterEach(async () => {
  process.env = env
  process.chdir(cwd)
  jest.restoreAllMocks()
  jest.resetAllMocks()
  await fs.remove(root)
})

const upload = () => commands[0]

describe('task: deploy', () => {
  test('uploads the builds to the bucket, then sets their cache policy', async () => {
    const { deploy } = load()

    await deploy({ builds: ['epub'], yes: true })

    expect(commands).toHaveLength(4)
    expect(upload()).toBe(
      `aws s3 cp ${root} s3://bucket/book --recursive --exclude "*" --region us-east-1 --include "*.epub"`
    )
    // Everything cached for a year, then the documents and downloads, and
    // the HTML, fetched fresh
    expect(commands[1]).toStartWith(
      'aws s3 cp s3://bucket/book s3://bucket/book --region us-east-1 --recursive --acl public-read'
    )
    expect(commands[1]).toContain('--cache-control max-age=31536000,public')
    expect(commands[2]).toContain('--include "*.opf"')
    expect(commands[2]).toContain('--cache-control max-age=0,public')
    expect(commands[3]).toContain('--include "*.xhtml"')
    expect(commands[3]).toContain('--content-type text/html')
  })

  test('deploys the epub, mobi and reader builds by default', async () => {
    const { deploy } = load()

    await deploy({ yes: true })

    expect(upload()).toEndWith(
      '--include "*.epub" --include "*.mobi" --include "project-reader/*"'
    )
  })

  test('ignores the case of build names, and unknown builds', async () => {
    const { deploy } = load()

    await deploy({ builds: ['PDF', 'Web', 'nope'], yes: true })

    expect(upload()).toEndWith('--include "*.pdf" --include "project-web/*"')
  })

  test('asks before deploying, and deploys on "y"', async () => {
    const rl = new EventEmitter()
    rl.setPrompt = jest.fn()
    rl.prompt = jest.fn(() => setImmediate(() => rl.emit('line', 'y')))
    rl.close = jest.fn(() => rl.emit('close'))
    mockCreateInterface.mockReturnValue(rl)
    const { deploy } = load()

    await deploy({ builds: ['epub'] })

    expect(rl.setPrompt).toHaveBeenCalledWith(' [yN] ')
    expect(console.log).toHaveBeenCalledWith(' Bucket URL:    s3://bucket/book')
    expect(commands).toHaveLength(4)
  })

  test('rejects, through log.error, without the AWS environment', async () => {
    delete process.env.BBER_BUCKET_REGION
    const { deploy, log } = load()

    await expect(deploy({ yes: true })).rejects.toThrow(
      '[AWS_ACCESS_KEY_ID], [AWS_SECRET_ACCESS_KEY] and [BBER_BUCKET_REGION] must be set'
    )
    expect(log.error).toHaveBeenCalled()
    expect(commands).toEqual([])
  })

  test('rejects, through log.error, without bucket_url in config.yml', async () => {
    await fs.writeFile('config.yml', YamlAdaptor.dump({ src: '_project' }))
    const { deploy } = load()

    await expect(deploy({ yes: true })).rejects.toThrow(
      '[bucketURL] must be set in config.yml'
    )
    expect(commands).toEqual([])
  })

  // Defect: the task exits the process itself, with status 0, when the aws
  // CLI is missing (src/deploy/index.ts:69). `bber deploy` reports success
  // having uploaded nothing.
  test('exits 0 when the aws CLI is not installed (defect)', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('aws: command not found')
    })
    const { deploy } = load()

    await expect(deploy({ yes: true })).rejects.toThrow('process.exit(0)')
    expect(console.log).toHaveBeenCalledWith(
      'AWS CLI must be installed to run deploy'
    )
  })

  // Defect: a failed aws command is printed and then ignored
  // (src/deploy/index.ts:86): the next step runs and the task resolves, so a
  // deploy whose upload failed still succeeds.
  test('resolves when the upload fails (defect)', async () => {
    exitCodes = [1]
    const { deploy } = load()

    await expect(deploy({ yes: true })).resolves.toBeUndefined()
    expect(console.log).toHaveBeenCalledWith('ERROR: aws exited with code 1')
    expect(commands).toHaveLength(4)
  })
})
