
import gulp from 'gulp';
import fs from 'fs';
import mkdirp from 'mkdirp';
import Q from 'q';
import tmpl from './templates';
import conf from './config';

gulp.task('create', (done) => {
  mkdirp(`${conf.dist}/OPS`, (err) => {
    if (err) { throw err; }
    fs.writeFile(`${conf.dist}/container.xml`, tmpl.container, (err) => {
      if (err) { throw err; }
      fs.writeFile(`${conf.dist}/mimetype`, tmpl.mimetype, (err) => {
        if (err) { throw err; }
        done();
      });
    });
  });
});
