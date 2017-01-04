
import bberEditor from 'bber-editor'
import opn from 'opn'

const editor = () =>
  new Promise((resolve /* , reject */) => {
    bberEditor.listen(8080, () => {
      opn('http://localhost:8080')
      resolve()
    })
    process.once('SIGTERM', () => {
      process.exit(0)
    })
    process.once('SIGINT', () => {
      process.exit(0)
    })
  })

export default editor
