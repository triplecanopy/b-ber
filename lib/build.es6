
import fs from 'fs';
import mkdirp from 'mkdirp';
import Q from 'q';
import tmpl from './templates';

export default {
  ops() {
    let dfr = Q.defer();
    mkdirp('./_output/OPS', err => {
      if (err) { throw err; }
      dfr.resolve();
    })
    return dfr.promise;
  },
  opf() {
    let dfr = Q.defer();
    fs.writeFile('./_output/content.opf', 'sample data', err => {
      if (err) { throw err; }
      dfr.resolve();
    });
    return dfr.promise;
  },
  xml() {
    let dfr = Q.defer();
    dfr.resolve();
    fs.writeFile('./_output/container.xml', tmpl.container, err => {
      if (err) { throw err; }
      fs.writeFile('./_output/mimetype', tmpl.mimetype, err => {
        if (err) {
          throw err;
        }
        dfr.resolve();
      });
    });
    return dfr.promise;
  }
};
