// ./node_modules/.bin/babel-node ./src/bber-connect/google/sync.es6

import download from './download'
// import fs from 'fs-extra'
// import path from 'path'
// import {src} from '@canopycanopycanopy/b-ber-lib/utils'

import {
    Cached,
    locations,
    providers,
    // prefixedAsset,
} from './helpers'

function sync() {
    const assets = []
    Object.entries(Cached.assets).forEach(([asset]) => {
        const location = locations[asset]()
        const provider = providers[asset]()

        // asset = (root, markdown), location = (id, folder name), provider = (google, dropbox)
        assets.push({ asset, location, provider })
    })


    // console.log(assets)
    download(assets)
    .catch(err => console.log(err))
    .then(data => {
        console.log()
        console.log()
        console.log()
        console.log(data)
        console.log('\ndone')
    })
}

// function sync() {
//   return download()
//   .then(({ source, clean }) => {
//     // const source = path.join(__dirname, 'tmp') // TODO: this should probably be app root
//     const dest = path.join(src(), '_markdown')
//     fs.copy(source, dest, { overwrite: true }, err0 => {
//       if (err0) { throw err0 }
//       if (clean) {
//         fs.remove(source, err1 => {
//           if (err1) { throw err1 }
//           console.log('Sync done!')
//         })
//       } else {
//         console.log('Sync done!')
//       }
//     })
//   })
// }

sync()
// // export default sync
