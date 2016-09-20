
import gulp from 'gulp';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import md from './md';

const textdir = path.join(__dirname + '/../_output/OPS/Text/');


let write = (file, data) => {
  fs.writeFile(
    textdir + path.basename(file, 'md') + 'html',
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
            if (fs.statSync(textdir)) {
              write(file, data);
            }
          } catch (e) {
            mkdirp(textdir, () => write(file, data));
          }
          if (idx === files.length - 1) { done(); }
        }
      );
    });
  });
});
