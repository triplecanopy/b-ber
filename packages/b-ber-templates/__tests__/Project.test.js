import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import fs from 'fs-extra'
import path from 'path'
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

  test('javascripts() returns a file descriptor with application.js content', () => {
    const projectPath = path.join(process.cwd(), '/_project')
    const [file] = Project.javascripts(projectPath)

    expect(file.relativePath).toContain('_javascripts/application.js')
    expect(file.absolutePath).toContain('_javascripts/application.js')
    expect(typeof file.content).toBe('string')
  })

  test('markdown() returns three starter markdown file descriptors', () => {
    const projectPath = path.join(process.cwd(), '/_project')
    const files = Project.markdown(projectPath)

    expect(files).toHaveLength(3)
    expect(files[0].relativePath).toContain('project-name-title-page.md')
    expect(files[1].relativePath).toContain('project-name-chapter-01.md')
    expect(files[2].relativePath).toContain('project-name-colophon.md')
    files.forEach((f) => {
      expect(typeof f.content).toBe('string')
      expect(f.absolutePath).toContain('_markdown')
    })
  })

  test('readme() returns a file descriptor with the project name substituted', () => {
    const projectPath = path.join(process.cwd(), '/_project')
    const file = Project.readme(projectPath)

    expect(file.relativePath).toContain('README.md')
    expect(file.absolutePath).toContain('README.md')
    expect(typeof file.content).toBe('string')
    expect(file.content).not.toContain('%PROJECT_NAME%')
  })

  test('gitignore() returns a file descriptor with gitignore content', () => {
    const projectPath = path.join(process.cwd(), '/_project')
    const file = Project.gitignore(projectPath)

    expect(file.relativePath).toContain('.gitignore')
    expect(file.absolutePath).toContain('.gitignore')
    expect(typeof file.content).toBe('string')
  })

  test('stylesheets() returns an empty array', () => {
    expect(Project.stylesheets()).toEqual([])
  })
})
