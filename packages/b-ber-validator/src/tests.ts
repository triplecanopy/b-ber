import util from 'util'
import { Failure } from 'b-ber-validator'
import report from './report'
import colors from './colors'
import parser from './validator'
import mocks from './mocks'

let err = false
// const names: Set<string> = new Set(['Test 1'])
const names: Set<string> = new Set([])

for (let i = 0; i < mocks.length; i++) {
  const { name, text } = mocks[i]
  if (names.size && !names.has(name)) continue

  const res = parser({ text, index: 0 })

  // if (res.success === false) {
  //   report(mocks[i].name, res as Failure)
  // }

  if (res.success !== mocks[i].success) {
    console.log(colors.fgred, `Error in ${mocks[i].name}`)

    report(mocks[i].name, res as Failure)
    console.log(util.inspect(res, false, null, true))

    err = true
  }
}

if (!err) {
  console.log('\nAll tests passed')
}
