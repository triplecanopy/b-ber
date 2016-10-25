
// TODO: remove gulp?

import gulp from 'gulp'
import gulpinject from 'gulp-inject'
import conf from './config'

const injectOptions = {
  ignorePath: ['..', `${conf.dist}`, 'OPS'],
  relative: true,
  selfClosingTag: true
}

const targets = gulp.src(`${conf.dist}/OPS/text/*.{xhtml,html}`)

const sources = gulp.src([
  `${conf.dist}/OPS/javascripts/*.js`,
  `${conf.dist}/OPS/stylesheets/*.css`
], { read: false })

const inject = () =>
  targets.pipe(gulpinject(sources, injectOptions))
    .pipe(gulp.dest(`${conf.dist}/OPS/text`))

export default inject
