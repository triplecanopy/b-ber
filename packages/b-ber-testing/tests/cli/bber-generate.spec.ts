import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { expect, runBber, test } from './helpers'

function parseTocEntryNames(tocPath: string): string[] {
  const raw = yaml.load(fs.readFileSync(tocPath, 'utf8')) as Array<
    string | Record<string, unknown>
  >
  return raw.map((entry) =>
    typeof entry === 'string' ? entry : Object.keys(entry)[0]
  )
}

test.describe('bber generate', () => {
  test('creates a new markdown file in _project/_markdown', ({
    fixtureCopy,
  }) => {
    const result = runBber(
      ['generate', 'new-test-chapter', 'bodymatter'],
      fixtureCopy
    )
    expect(result.status, result.stderr).toBe(0)

    const mdPath = path.join(
      fixtureCopy,
      '_project',
      '_markdown',
      'new-test-chapter.md'
    )
    expect(fs.existsSync(mdPath)).toBe(true)
  })

  test('updates toc.yml with the new entry', ({ fixtureCopy }) => {
    const tocPath = path.join(fixtureCopy, '_project', 'toc.yml')
    const beforeNames = parseTocEntryNames(tocPath)
    expect(beforeNames).not.toContain('new-test-chapter')

    runBber(['generate', 'new-test-chapter', 'bodymatter'], fixtureCopy)

    const afterNames = parseTocEntryNames(tocPath)
    expect(afterNames).toContain('new-test-chapter')
  })
})
