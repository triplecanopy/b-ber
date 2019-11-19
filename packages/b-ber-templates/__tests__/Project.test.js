/* global test,expect */

import fs from 'fs-extra'
import path from 'path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import Project from '../src/Project'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => {
  // eslint-disable-next-line global-require
  const Config = require('@canopycanopycanopy/b-ber-lib/Config').default
  const config = new Config()
  return { config }
})

afterAll(() => fs.remove('_project'))

describe('templates.Project', () => {
  test('it creates the source directories', () => {
    const cwd = process.cwd()
    const projectDir = '/_project'
    const projectPath = path.join(cwd, projectDir)
    const directories = Project.directories(projectPath)

    expect(directories).toEqual([
      `${cwd}${projectDir}/_images`,
      `${cwd}${projectDir}/_javascripts`,
      `${cwd}${projectDir}/_stylesheets`,
      `${cwd}${projectDir}/_markdown`,
      `${cwd}${projectDir}/_fonts`,
      `${cwd}${projectDir}/_media`,
      `${cwd}${projectDir}/.tmp`,
    ])
  })

  test('it writes valid YAML', () => {
    const cwd = process.cwd()
    const projectDir = '/_project'
    const projectPath = path.join(cwd, projectDir)

    expect(Project.tocYAML(projectPath).content).not.toMatch(/^\s+-/)
    expect(Project.metadataYAML(projectPath).content).not.toMatch(/^\s+-/)
  })

  test('it writes a config file that mirrors default state', () => {
    const cwd = process.cwd()
    const projectDir = '/_project'
    const projectPath = path.join(cwd, projectDir)
    const yamlConfig = Project.configYAML(projectPath).content
    const configObj = YamlAdaptor.parse(yamlConfig)

    expect(configObj).toEqual(state.config)
  })
})
