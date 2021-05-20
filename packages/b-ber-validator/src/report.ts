import { Failure } from 'b-ber-validator'
import colors from './colors'

export default function report(name: string, res: Failure) {
  console.log(colors.reset, '')
  console.log(colors.fgred, `Error in ${name}`)
  console.log(colors.reset, '')

  let beforeStr = ''
  let afterStr = ''
  let beforeArr = []
  let afterArr = []

  const { text, index } = res.ctx

  // Up to error
  beforeStr = text.slice(0, index)
  afterStr = text.slice(index)

  const line = text.slice(
    beforeStr.lastIndexOf('\n') + 1,
    index + afterStr.indexOf('\n') + 1
  )

  beforeArr = beforeStr.split('\n')
  afterArr = afterStr.split('\n')

  const spacesLen = beforeArr[beforeArr.length - 1].length
  const lineNumber = beforeArr.length
  const carat = `${' '.repeat(spacesLen)}^`

  beforeArr.pop()
  beforeArr = beforeArr.slice(-3)
  afterArr = afterArr.slice(1, 3)

  console.log('Expected', res.expected)
  console.log('On line', lineNumber)
  console.log(colors.reset, '')
  console.log(colors.dim, beforeArr.join('\n'))
  console.log(colors.reset, line)
  console.log(colors.reset, carat)
  console.log(colors.dim, afterArr.join('\n'))
  console.log(colors.reset, '')
}
