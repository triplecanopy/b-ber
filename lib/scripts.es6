
import gulp from 'gulp';
import jshint from 'gulp-jshint';
import conf from './config';

gulp.task('scripts', () =>
  gulp.src(['_javascripts/**/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest(`${conf.dist}/OPS/javascripts`))
);
