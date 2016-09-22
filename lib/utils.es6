
import path from 'path';
import _ from 'lodash';
import fs from 'fs';

function copy(source, target) {
  return new Promise((resolve, reject) => {
    let rd = fs.createReadStream(source);
    rd.on('error', reject);
    let wr = fs.createWriteStream(target);
    wr.on('error', reject);
    wr.on('finish', resolve);
    return rd.pipe(wr);
  });
}

function slashit(str) {
  let fpath = str;
  try {
    if (typeof fpath !== 'string') {
      throw new Error(`Path must be a string. '${typeof fpath}' given.`);
    }
  } catch (e) {
    console.log(e.message);
    process.exit();
  }

  if (fpath.substr(-1) !== '/') {
    fpath = fpath.concat('/');
  }

  return fpath;
}

function topdir(file) {
  return slashit(path.basename(path.dirname(file))) + path.basename(file);
}

function cjoin(arr) {
  return _.compact(arr).join('\n');
}

function fileid(str) {
  return '_'.concat(str.replace(/[\s:,“”‘’]/g, '_'));
}

export {
  slashit,
  topdir,
  cjoin,
  fileid,
  copy,
};
