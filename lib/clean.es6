
import gulp from 'gulp';
import path from 'path';
import cp from 'child_process';

const exec = cp.exec;
const dir = path.join(__dirname, '../', '_output');

gulp.task('clean', (done) => {
  try {
    if (fs.statSync(dir)) {
      exec(`rm -rf ${dir}`, (err, stdout, stderr) => {
        if (err) { throw err; }
        if (stderr !== '') { console.log(stderr); }
        done();
        console.log('clean done');
      })
    }
  } catch (e) {
    done();
    console.log('clean done');
  }
});
