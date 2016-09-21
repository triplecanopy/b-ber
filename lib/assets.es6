
import fs from 'fs';
import mkdirp from 'mkdirp';
import Q from 'q';
import tmpl from './templates';
import conf from './config';

export default {
  ops() {
    let dfr = Q.defer();
    mkdirp(`${conf.dist}/OPS`, (err) => {
      if (err) { throw err; }
      dfr.resolve();
    });
    return dfr.promise;
  },
  xml() {
    let dfr = Q.defer();
    dfr.resolve();
    fs.writeFile(`${conf.dist}/container.xml`, tmpl.container, (err) => {
      if (err) { throw err; }
      fs.writeFile(`${conf.dist}/mimetype`, tmpl.mimetype, (err) => {
        if (err) {
          throw err;
        }
        dfr.resolve();
      });
    });
    return dfr.promise;
  },
};
