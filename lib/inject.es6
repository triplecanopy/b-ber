
import gulp from 'gulp';
import inject from 'gulp-inject';

let injectOptions = {
  ignorePath: ['..', '_output', 'OPS'],
  relative: true,
  selfClosingTag: true
};

let targets = gulp.src('_output/OPS/text/*.{xhtml,html}');

let sources = gulp.src([
  '_output/OPS/javascripts/*.js',
  '_output/OPS/stylesheets/*.css'
], { read: false });

gulp.task('inject', done =>
  targets.pipe(inject(sources, injectOptions))
  .pipe(gulp.dest('_output/OPS/text'))
)
