
import path from 'path'
import del from 'del'
import conf from './config'

const dist = path.join(__dirname, '../', `${conf.dist}`)

const clean = () =>
  del(dist).then((paths) => {
    console.log('Deleted files and folders:\n', paths.join('\n'))
  })

export default clean
