
import fs from 'fs-extra'
import { dist } from '../utils'

const clean = () =>
  new Promise((resolve, reject) => {
    fs.remove(dist(), (err) => {
      if (err) { reject(err) }
      resolve()
    })
  })

export default clean
