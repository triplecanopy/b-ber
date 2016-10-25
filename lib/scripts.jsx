
import gulp from 'gulp'
import jshint from 'gulp-jshint'
import path from 'path'
import conf from './config'

gulp.task('scripts', () =>
  gulp.src(path.join(__dirname, `../${conf.src}`, '_javascripts/**/*'))
    .pipe(jshint(path.join(__dirname, `../${conf.src}`, '.jshintrc')))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest(`${conf.dist}/OPS/javascripts`))
)
