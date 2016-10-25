
import gulp from 'gulp'

const deps = [
  'clean',
  'create',
  // 'copy',
  // 'sass',
  // 'scripts',  // async
  // 'render',
  // 'inject',
  // 'opf',
]

gulp.task('build', deps, () => console.log('Build succeeded!'))
