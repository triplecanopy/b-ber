// Increment independant packages when versioning and add them to Lerna's commit

const fs = require('fs')
const path = require('path')
const semver = require('semver') // eslint-disable-line import/no-extraneous-dependencies
const { exec } = require('child_process')

const nextVersion = semver.inc(
  process.env.npm_config_version,
  process.env.npm_config_bump,
  process.env.npm_config_preid || 'alpha'
)

console.log('Updating independant packages', nextVersion)

const packageFiles = [
  path.resolve('packages/b-ber-themes/b-ber-theme-sans/package.json'),
  path.resolve('packages/b-ber-themes/b-ber-theme-serif/package.json'),
]

packageFiles.forEach(file => {
  const data = fs.readFileSync(file, 'utf8')
  const json = JSON.parse(data)
  json.version = nextVersion

  fs.writeFileSync(file, `${JSON.stringify(json, null, 4)}\n`)
})

exec(`git add ${packageFiles.join(' ')}`, (error, stdout, stderr) => {
  if (error) throw error
  if (stdout) console.log(`stdout: ${stdout}`)
  if (stderr) console.log(`stderr: ${stderr}`)
})
