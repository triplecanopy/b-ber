
import gulp from 'gulp';
import request from 'request';
import unzip from 'unzip';
import conf from './config';

gulp.task('site', () =>
  request(conf.gomez)
    .pipe(unzip.Extract({ path: './' }))
);
