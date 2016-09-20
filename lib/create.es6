
import gulp from 'gulp';
import build from './build';

gulp.task('create', () => build.ops().then(build.xml()));
