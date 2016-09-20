
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

class FileAttrs {
  constructor() {
    this.isNav = function (file) {
      return Boolean(path.basename(file) === 'toc.ncx' || path.basename(file) === 'toc.xhtml');
    };
    this.isScripted = function (file) {
      if (mime.lookup(file.fullpath) !== 'text/html' && mime.lookup(file.fullpath) !== 'application/xhtml+xml') {
        return false;
      }

      let fpath = path.join(__dirname, '../', file.fullpath);
      let contents = fs.readFileSync(fpath, 'utf8');
      return Boolean(contents.match(/<script/));
    };
    this.isSVG = function (file) {
      if (mime.lookup(file.fullpath) !== 'text/html' && mime.lookup(file.fullpath) !== 'application/xhtml+xml') {
        return false;
      }

      let fpath = path.join(__dirname, '../', file.fullpath);
      let contents = fs.readFileSync(fpath, 'utf8');
      return Boolean(contents.match(/<svg/));
    };
  }

  test(file) {
    let attrs = [];
    if (this.isNav(file))       { attrs.push('nav') }
    if (this.isScripted(file))  { attrs.push('scripted') }
    if (this.isSVG(file))       { attrs.push('svg') }
    return attrs.join(',');
  }
}

export default FileAttrs;
