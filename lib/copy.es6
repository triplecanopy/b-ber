
import gulp from 'gulp';

const images = gulp.src('_images/*.{png,gif,jpg}');

gulp.task('copy', () =>
  images.pipe(gulp.dest('_output/OPS/images'))
);
