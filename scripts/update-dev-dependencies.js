const fs = require('fs-extra')
const path = require('path')

async function main() {
  const cwd = process.cwd()

  const basePath = path.resolve(cwd, 'package.json')
  const baseJson = await fs.readJSON(basePath)
  const { devDependencies: baseDeps } = baseJson

  const dirs = await fs.readdir(path.resolve(cwd, 'packages'))
  const deps = await dirs.reduce(async (acc, dir) => {
    const file = path.resolve(cwd, 'packages', dir, 'package.json')

    if (!(await fs.pathExists(file))) {
      return acc
    }

    const { devDependencies } = await fs.readJSON(file)

    return devDependencies ? (await acc).concat(devDependencies) : acc
  }, Promise.resolve([baseDeps]))

  const set = new Set(
    deps.reduce((acc, dep) => {
      return acc.concat(
        Object.entries(dep).map(([pkg, version]) => `${pkg}:${version}`)
      )
    }, [])
  )

  const devDependencies = Array.from(set)
    .sort()
    .map(a => a.split(':'))
    .reduce((acc, [key, val]) => {
      acc[key] = val
      return acc
    }, {})

  baseJson.devDependencies = devDependencies
  await fs.writeJson(basePath, baseJson, { spaces: 2 })

  console.log('Done')
}

main()
