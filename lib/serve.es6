
import gulp from 'gulp';
import express from 'express';

gulp.task('serve', () => {
  let app = express();
  app.get('/', (req, res) => {
    res.send('Hello World');
  });
  app.listen(3000);
});
