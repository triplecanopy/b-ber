
import gulp from 'gulp';
import renderLayouts from 'layouts';
import templates from './templates';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import File from 'vinyl';
import rrdir from 'recursive-readdir';

let topdir = file =>
  path.basename(path.dirname(file)) + '/' + path.basename(file);

let manifest = done =>
  rrdir('./_output/OPS', (err, files) =>
    files.forEach((file, idx) => {
      files[idx] = {
        fullpath: file,
        toppath: topdir(file),
        name: path.basename(file)
      };
      if (idx === files.length - 1) { done(files) }
    })
  );

gulp.task('opf', done =>
  manifest(files => {
    let manifestarr = [];
    files.forEach((file, idx) => {
      manifestarr.push(templates.item(file));
      if (idx == files.length - 1) {
        let markup = renderLayouts(new File({
          path: './.tmp',
          layout: 'page',
          contents: new Buffer(files.join('\n'))
        }), templates).contents.toString();
        done();
      }
    });
  })
);
