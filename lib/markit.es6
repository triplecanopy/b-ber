
import gulp from 'gulp';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import md from './md';

const tmpdir = path.join(__dirname + '/../.tmp/');


let write = (file, data) => {
  fs.writeFile(
    tmpdir + path.basename(file, 'md') + 'html',
    md.render(data),
    err => {
      if (err) { throw err; }
    }
  );
};

gulp.task('markit', done => {
  fs.readdir('./_markdown', (err, files) => {
    if (err) { throw err; }
    files.forEach((file, idx) => {
      fs.readFile(
        path.join(__dirname + '/../_markdown/', file),
        'utf8',
        (err, data) => {
          if (err) { throw err; }
          try {
            if (fs.statSync(tmpdir)) {
              write(file, data);
            }
          } catch (e) {
            mkdirp(tmpdir, () => write(file, data));
          }
          if (idx === files.length - 1) { done(); }
        }
      );
    });
  });
});
