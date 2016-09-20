
import gulp from 'gulp';
import inject from 'gulp-inject';

const injectOptions = {
  ignorePath: ['..', '_output', 'OPS'],
  relative: true,
  selfClosingTag: true
};

const targets = gulp.src('_output/OPS/text/*.{xhtml,html}');

const sources = gulp.src([
  '_output/OPS/javascripts/*.js',
  '_output/OPS/stylesheets/*.css',
], { read: false });

gulp.task('inject', () =>
  targets.pipe(inject(sources, injectOptions))
  .pipe(gulp.dest('_output/OPS/text'))
);
