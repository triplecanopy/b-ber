// Builds a throwaway b-ber project in a real temp directory and points the
// shared State singleton at it. Under Jest, State skips its own
// initialisation (process.argv is too short), so its build settings are
// assembled here the way `State.loadBuildSettings` would.
//
// Every field changed on State is recorded and put back by `cleanup`, so a
// test file does not leak a project into the next.
//
// With `chdir: true` the process moves into the temp directory and State is
// given relative `src` and `dist`, as a real `b-ber build` run from the
// project root has. Some tasks join process.cwd() onto State's paths and
// only work that way.
//
// `dist` is config.yml's `dist`, the stem of each build's directory
// (`<dist>-<build>`).

import os from 'node:os'
import path from 'node:path'
import { Spine } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import fs from 'fs-extra'

const STATE_FIELDS = ['config', 'build', 'builds', 'metadata']

const toYamlList = (entries) =>
  entries
    .map((entry) => {
      if (typeof entry === 'string') return `- ${entry}`
      const [[name, attrs]] = Object.entries(entry)
      const lines = Object.entries(attrs).map(([k, v]) => `    ${k}: ${v}`)
      return [`- ${name}:`, ...lines].join('\n')
    })
    .join('\n')

export async function createProject({
  build = 'epub',
  toc = [],
  markdown = {},
  metadata = [],
  config = {},
  chdir = false,
  dist: distName = 'project',
} = {}) {
  const saved = {}
  for (const field of STATE_FIELDS) saved[field] = state[field]
  const cwd = process.cwd()

  // realpath: on macOS os.tmpdir() is behind a symlink, and process.cwd()
  // reports the resolved path
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-tasks-'))
  )
  if (chdir) process.chdir(root)
  const base = chdir ? '' : root
  const src = path.join(base, '_project')
  const distBase = path.join(base, distName)
  const dist = `${distBase}-${build}`

  await fs.ensureDir(path.join(src, '_markdown'))
  await fs.writeFile(path.join(src, 'toc.yml'), toYamlList(toc))
  await Promise.all(
    Object.entries(markdown).map(([name, body]) =>
      fs.writeFile(path.join(src, '_markdown', `${name}.md`), body)
    )
  )

  state.config = { ...saved.config, src, dist: distBase, ...config }
  state.build = build
  state.metadata = { json: () => metadata }

  const spine = new Spine({
    src,
    dist,
    navigationConfigFile: path.join(src, 'toc.yml'),
  })

  state.builds = {
    ...saved.builds,
    [build]: {
      src,
      dist,
      config: {},
      guide: [],
      spine,
      toc: spine.nested,
      cursor: [],
      figures: [],
      footnotes: [],
      remoteAssets: [],
      loi: [],
    },
  }

  const cleanup = async () => {
    for (const field of STATE_FIELDS) state[field] = saved[field]
    process.chdir(cwd)
    await fs.remove(root)
  }

  return { root, src, dist, cleanup }
}
