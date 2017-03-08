
/**
 * @module editor
 */

import bberEditor from 'bber-editor'
import opn from 'opn'

/**
 * Launch b-ber editor in a browser
 * @return {Promise<Object|Error>}
 */
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
