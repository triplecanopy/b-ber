// Create the minimum project structure that b-ber-lib/State needs to
// initialise without calling process.exit. Runs before any test file is
// loaded (setupFiles), so the filesystem is ready when command modules
// import State on the first require().
const fs = require('fs-extra')
const path = require('path')

const projectDir = path.resolve('_project')
const mediaDir = path.join(projectDir, '_media')
const tocFile = path.join(projectDir, 'toc.yml')

fs.mkdirpSync(mediaDir)
if (!fs.existsSync(tocFile)) {
  fs.writeFileSync(tocFile, '[]\n', 'utf8')
}
