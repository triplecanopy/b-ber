// Update `version` module

const fs = require('fs-extra')
const path = require('path')

const tmpl = version => `const version = '${version}'\nexport default version\n`

async function main() {
  const { npm_package_version: version } = process.env

  const file = path.resolve(process.cwd(), 'src', 'lib', 'version.js')
  const content = tmpl(version)

  await fs.writeFile(file, content, 'utf8')

  console.log('Updated b-ber-react-reader version %s', version)
}

main()
