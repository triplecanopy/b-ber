#!/usr/bin/env node

import fs from 'fs-extra'

if (process.argv.indexOf('--version') > -1) {
    console.log(fs.readJSONSync(require.resolve('../package.json')).version)
    process.exit()
} else {
    const bber = require('./app').default // eslint-disable-line global-require
    bber()
}
