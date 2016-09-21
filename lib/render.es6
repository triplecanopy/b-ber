
import gulp from 'gulp';
import renderLayouts from 'layouts';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import File from 'vinyl';

import templates from './templates';

// import browserify from 'browserify';
// import source from 'vinyl-source-stream';
// import buffer from 'vinyl-buffer';

const tmpdir = path.join(__dirname, '/../.tmp');
const output = path.join(__dirname, '/../_output/OPS/text/');

const write = (file, data, idx, len, done) =>
  fs.writeFile(
    output + path.basename(file),
    data,
    (err) => {
      if (err) { throw err; }
      if (idx === len) {
        done();
        console.log('render done');
      }
    }
  );

const generateMarkup = (file, data, idx, len, done) => {
  let markup = renderLayouts(new File({
    path: './.tmp',
    layout: 'page',
    contents: new Buffer(data),
  }), templates).contents.toString();

  try {
    if (fs.statSync(output)) {
      write(file, markup, idx, len, done);
    }
  } catch (e) {
    mkdirp(output, () => write(file, markup, idx, len, done));
  }
};

gulp.task('render', done =>
  fs.readdir(tmpdir, (err, files) => {
    if (err) { throw err; }
    return files.forEach((file, idx) => (
      fs.readFile(
        path.join(__dirname, '../.tmp', file),
        'utf8',
        (err, data) => {
          if (err) { throw err; }
          return generateMarkup(file, data, idx, files.length - 1, done);
          // if (idx === files.length - 1) {
          //   console.log('render done');
          //   done();
          // }
        }
      )
    ));
  })
);
