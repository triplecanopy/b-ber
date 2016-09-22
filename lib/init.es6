
import gulp from 'gulp';
import fs from 'fs';
import mkdirp from 'mkdirp';

const path = yargs.argv.path;

const dirs = [
  `${path}`,
  `${path}/_images`,
  `${path}/_javascripts`,
  `${path}/_stylesheets`,
  `${path}/.tmp`,
];

const files = [{
  name: 'config.yml',
  content: `---
environment: development
output_path:
  development: ./${path}
  production: ./book`,
}, {
  name: 'metadata.yml',
  content: `---
metadata:
  title: Test Book
  creator: First Last
  language: en-US
  rights: © First Last
  publisher: Publisher Name
  contributor: Contributor 1
  contributor: Contributor 2
  contributor: Contributor 3
  identifier: c282f98b794648d1bedc22837b8c4b71
  cover_file: cover.jpg
  cover_path: _images/cover.jpg`,
}, {
  name: '.jshintrc',
  content: '',
}];

gulp.task('init', () => {
  dirs.forEach((dir, idx) => {
    mkdirp(dir, () => {
      if (idx === dirs.length - 1) {
        files.map(_ =>
          fs.writeFile(`path/${_.name}`, _.content, (err) => {
            if (err) { throw err; }
          })
        );
      }
    });
  });
});
