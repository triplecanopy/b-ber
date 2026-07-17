import fs from 'fs-extra'
import path from 'path'

type AssetMap = Record<string, string>

// Images live at the package root; dist/ is one level below.
const packageRoot = path.resolve(__dirname, '..')

export default (): Promise<AssetMap> =>
  fs.readdir(packageRoot).then((data) => {
    const assets: AssetMap = {}
    data
      .filter((a) => /png|jpe?g/.test(path.extname(a)))
      .map(
        (a) =>
          (assets[path.basename(a, path.extname(a))] = path.join(
            packageRoot,
            a
          ))
      )
    return assets
  })
