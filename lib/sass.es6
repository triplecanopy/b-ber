
import gulp from 'gulp';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';

let sassOptions = { errLogToConsole: true, outputStyle: 'nested' };
let autoprefixerOptions = { browsers: ['last 2 versions', '> 2%'], flexbox: 'no-2009' };

gulp.task('sass', () =>
  gulp.src([
    '_stylesheets/application.scss',
  ])
  .pipe(sass(sassOptions))
  .pipe(autoprefixer(autoprefixerOptions))
  .pipe(gulp.dest('_output'))
);
