
import gulp from 'gulp';
import inject from 'gulp-inject';
import conf from './config';

const injectOptions = {
  ignorePath: ['..', `${conf.dist}`, 'OPS'],
  relative: true,
  selfClosingTag: true,
};

const targets = gulp.src(`${conf.dist}/OPS/text/*.{xhtml,html}`);

const sources = gulp.src([
  `${conf.dist}/OPS/javascripts/*.js`,
  `${conf.dist}/OPS/stylesheets/*.css`,
], { read: false });

gulp.task('inject', () =>
  targets.pipe(inject(sources, injectOptions))
  .pipe(gulp.dest(`${conf.dist}/OPS/text`))
);
