
import gulp from 'gulp';
import fs from 'fs';
import mkdirp from 'mkdirp';
import yargs from 'yargs';
import path from 'path';

gulp.task('init', () => {

  const output = yargs.argv.path;

  const dirs = [
    `${output}`,
    `${output}/_images`,
    `${output}/_javascripts`,
    `${output}/_stylesheets`,
    `${output}/_text`,
    `${output}/.tmp`,
  ];

  const files = [{
    name: 'config.yml',
    content: `---
environment: development
output_path:
  development: ${output}
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

  dirs.map((dir, idx) => {
    mkdirp(path.join(__dirname, '../', dir), () => {
      if (idx === dirs.length - 1) {
        files.map(_ =>
          fs.writeFile(`${output}/${_.name}`, _.content, (err) => {
            if (err) { throw err; }
          })
        );
      }
    });
  });
});
