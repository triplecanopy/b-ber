
import gulp from 'gulp';
import conf from './config';

const images = gulp.src('_images/*.{png,gif,jpg}');

gulp.task('copy', () =>
  images.pipe(gulp.dest(`${conf.dist}/OPS/images`))
);
