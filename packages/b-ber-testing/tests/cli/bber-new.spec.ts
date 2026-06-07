import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { expect, runBber, test } from './helpers'

test.describe('bber new', () => {
  test('creates expected directory structure', ({ tmpDir }) => {
    const result = runBber(['new', 'test-project'], tmpDir)
    expect(result.status, result.stderr).toBe(0)

    const projectDir = path.join(tmpDir, 'test-project')
    expect(fs.existsSync(projectDir)).toBe(true)
    expect(fs.existsSync(path.join(projectDir, '_project', '_markdown'))).toBe(
      true
    )
    expect(fs.existsSync(path.join(projectDir, '_project', '_media'))).toBe(
      true
    )
  })

  test('toc.yml exists and parses as valid YAML', ({ tmpDir }) => {
    runBber(['new', 'test-project'], tmpDir)

    const tocPath = path.join(tmpDir, 'test-project', '_project', 'toc.yml')
    expect(fs.existsSync(tocPath)).toBe(true)

    let parsed: unknown
    expect(() => {
      parsed = yaml.load(fs.readFileSync(tocPath, 'utf8'))
    }).not.toThrow()
    expect(Array.isArray(parsed)).toBe(true)
  })
})
