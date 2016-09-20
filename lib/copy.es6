
import gulp from 'gulp';

let images = gulp.src('_images/*.{png,gif,jpg}');

gulp.task('copy', done =>
  images.pipe(gulp.dest('_output/OPS/images'))
);
