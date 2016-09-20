
import gulp from 'gulp';
import renderLayouts from 'layouts';
import templates from './templates';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import File from 'vinyl';

// import browserify from 'browserify';
// import source from 'vinyl-source-stream';
// import buffer from 'vinyl-buffer';

const tmpdir = path.join(__dirname, '/../.tmp');
const output = path.join(__dirname, '/../_output/text/');

let write = (file, data) => {
  fs.writeFile(
    output + path.basename(file),
    data,
    err => { if (err) { throw err; } }
  );
};

gulp.task('render', done =>
  fs.readdir(tmpdir, (err, files) => {
    if (err) { throw err; }
    files.forEach((file, idx) => {
      fs.readFile(
        path.join(__dirname, '../.tmp', file),
        'utf8',
        (err, data) => {
          if (err) { throw err; }

          let markup = renderLayouts(new File({
            path: './.tmp',
            layout: 'base',
            contents: new Buffer(data)
          }), templates).contents.toString();

          try {
            if (fs.statSync(output)) {
              write(file, markup);
            }
          } catch (e) {
            mkdirp(output, () => write(file, data));
          }
          if (idx === files.length - 1) { done(); }
      });
    });
  })
);
