
import { getImageOrientation } from 'bber-utils'
import epub from './epub'
import mobi from './mobi'

const figures = { epub, mobi }

const figure = (data, env) => {
  const { width, height } = data
  const type = !env || !{}.hasOwnProperty.call(figures, env) ? 'epub' : env
  const format = getImageOrientation(width, height)
  return figures[type][format](data)
}

export default figure
