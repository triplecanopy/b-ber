
import gulp from 'gulp';

const deps = [
  'clean',    // sync
  'create',   // sync
  'copy',     // async
  'sass',     // async
  'scripts',  // async
  'render',   // async
  'opf',      // sync
];

gulp.task('build', deps, () => console.log('Build succeeded!'));
