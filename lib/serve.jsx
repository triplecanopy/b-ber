
import express from 'express'

const serve = () => {
  const app = express()
  app.get('/', (req, res) => {
    res.send('Hello World')
  })
  app.listen(3000)
}

export default serve
