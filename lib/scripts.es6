
import gulp from 'gulp';
import jshint from 'gulp-jshint';

gulp.task('scripts', () =>
  gulp.src(['_javascripts/**/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest('_output/OPS/javascripts'))
);
