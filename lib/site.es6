
import gulp from 'gulp';
import request from 'request';
import unzip from 'unzip';
import cp from 'child_process';
import fs from 'fs';
import yargs from 'yargs';

import conf from './config';

const exec = cp.exec;
const path = yargs.argv.path;

const download = done =>
  (conf && conf.gomez)
  ? request(conf.gomez)
    .pipe(unzip.Extract({ path: `${path}` }))
    .on('finish', () => done())
  : done();

const verify = done => {
  try {
    if (fs.statSync(`${path}/package.json`)) {
      exec('npm install', { cwd: `${path}` }, (err, stdout, stderr) => {
        if (err) { throw err; }
        if (stderr !== '') { console.log(stderr); }
        done();
      });
    }
  } catch (e) {
    console.log(`\n${path}/package.json does not exist, try initializing b-ber again with \`b-ber init\`.`);
    console.log(e.message + '\n');
    process.exit();
  }
};


gulp.task('site', () =>
  download(() =>
    verify(() => console.log('Site done'))
  )
);
