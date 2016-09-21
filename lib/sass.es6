
import gulp from 'gulp';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import conf from './config';

const sassOptions = { errLogToConsole: true, outputStyle: 'nested' };
const autoprefixerOptions = { browsers: ['last 2 versions', '> 2%'], flexbox: 'no-2009' };

gulp.task('sass', done =>
  gulp.src(['_stylesheets/application.scss'])
  .pipe(sass(sassOptions))
  .pipe(autoprefixer(autoprefixerOptions))
  .pipe(gulp.dest(`${conf.dist}/OPS/stylesheets`))
);
