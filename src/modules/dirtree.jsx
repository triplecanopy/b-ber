
// Adapted from http://stackoverflow.com/questions/11194287/convert-a-directory-structure-in-the-filesystem-to-json-with-node-js

import fs from 'fs-extra'
import path from 'path'
import util from 'util'

// TODO: Error handling, renaming
// TODO: will probably need to add a function to flatten the output and rename
// files

class DirTree {
  static list(fpath) {
    const stats = fs.lstatSync(fpath)
    const info = {
      path: fpath,
      name: path.basename(fpath)
    }

    if (stats.isDirectory()) {
      info.type = 'directory'
      info.children = fs.readdirSync(fpath).map(child => DirTree.list(fpath + '/' + child))
    } else {
      // Assuming it's a file. In real life it could be a symlink or
      // something else!
      info.type = 'file'
    }

    return info
  }
}


const out = DirTree.list(path.join(process.cwd(), '_book'))
console.log(util.inspect(out, false, null))
