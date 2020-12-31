import util from 'util'
import { Failure } from 'b-ber-validator'
import report from './report'
import colors from './colors'
import parser from './validator'
import mocks from './mocks'

let err = false

for (let i = 0; i < mocks.length; i++) {
  const res = parser({ text: mocks[i].text, index: 0 })

  // if (res.success === false) {
  //   report(mocks[i].name, res)
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

// const text = 'footer '

// const res = parser({ text, index: 0 })

// if (res.success === false) {
//   report('xx', res as Failure)
// } else {
//   console.log('Ok')
// }

// console.log(res)
