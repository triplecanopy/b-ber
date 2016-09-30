
import gulp from 'gulp';
import yargs from 'yargs';
import path from 'path';
import cdir from 'copy-dir';
import mkdirp from 'mkdirp';

import { slashit } from './utils';

gulp.task('publish', (done) => {

  const book = yargs.argv.input;
  const site = yargs.argv.output;
  const output = path.join(yargs.argv.output, book);

  const dirs = [
    `${book}/_images`,
    `${book}/_javascripts`,
    `${book}/_stylesheets`,
    `${book}/_text`,
  ];

  mkdirp(output, () =>
    dirs.forEach((dir, idx) => cdir(dir, `${slashit(site)}${dir}`, (err) => {
      if (err) { throw err; }
      if (idx === dirs.length - 1) { done(); }
    }))
  );

});
