
import gulp from 'gulp';
import express from 'express';

gulp.task('serve', function () {
  let app = express();
  app.get('/', function (req, res) {
    res.send('Hello World');
  });
  app.listen(3000);
});
