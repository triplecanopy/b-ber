/* global test,expect */

import path from 'path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import Project from '../src/Project'

describe('templates.Project', () => {

    test('it creates the source directories', () => {

        const cwd = '/test'
        const projectDir = '/_project'
        const projectPath = path.join(cwd, state.src)

        const directories = Project.directories(projectPath)

        expect(directories).toEqual([
            `${cwd}${projectDir}`,
            `${cwd}/themes`,
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
        const cwd = '/test'
        const projectPath = path.join(cwd, state.src)

        expect(Project.typeYAML(projectPath).content).not.toMatch(/^\s+-/)
        expect(Project.metadataYAML(projectPath).content).not.toMatch(/^\s+-/)

    })

    test('it writes a config file that mirrors default state', () => {
        const cwd = '/test'
        const projectPath = path.join(cwd, state.src)
        const yamlConfig = Project.configYAML(projectPath).content
        const configObj = YamlAdaptor.parse(yamlConfig)

        expect(configObj).toEqual(state.config)

    })

})
