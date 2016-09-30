
import gulp from 'gulp';
import unzip from 'unzip2';
import cp from 'child_process';
import fs from 'fs';
import yargs from 'yargs';
import path from 'path';
import http from 'http';

import conf from './config';

const exec = cp.exec;

const download = (dest, done) => {
  if (conf && conf.gomez) {
    http.get(conf.gomez, (resp) => {
      resp.pipe(unzip.Extract({ path: path.join(__dirname, `../${dest}`) })
        .on('error', e => console.log(e.message))
        .on('close', () => console.log('close'))
        .on('finish', () => done(dest))
      );
    });
  }
};

const verify = (dest, done) => {
  try {
    if (fs.statSync(`${dest}/package.json`)) {
      exec('npm install', { cwd: dest }, (err, stdout, stderr) => {
        if (err) { throw err; }
        if (stderr !== '') { console.log(stderr); }
        if (stdout !== '') { console.log(stdout); }
        done();
      });
    }
  } catch (e) {
    console.log(`\n${dest}/package.json does not exist, try initializing b-ber again with \`b-ber init\`.`);
    console.log(e.message + '\n');
    process.exit();
  }
};


gulp.task('site', (done) => {
  const dest = yargs.argv.path;
  download(dest, resp => verify(resp, done))
});
