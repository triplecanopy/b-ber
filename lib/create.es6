
import gulp from 'gulp';
import assets from './assets';

gulp.task('create', (done) => {
  assets.ops().then(assets.xml());
  console.log('create done');
  done();
});
