import { Failure } from 'b-ber-validator'
import colors from './colors'

export default function report(name: string, res: Failure) {
  console.log(colors.reset, '')

  let tmpA = ''
  let tmpB = ''
  let tmpAA = []
  let tmpBB = []

  const { text, index } = res.ctx

  // Up to error
  tmpA = text.slice(0, index)
  tmpB = text.slice(index)

  const line = text.slice(
    tmpA.lastIndexOf('\n') + 1,
    index + tmpB.indexOf('\n') + 1
  )

  tmpAA = tmpA.split('\n')
  tmpBB = tmpB.split('\n')

  const len = tmpAA[tmpAA.length - 1].length
  const space = len - 1 > 0 ? len - 1 : 0
  const lineNumber = tmpAA.length

  tmpAA.pop()
  tmpAA = tmpAA.slice(-3)
  tmpBB = tmpBB.slice(1, 3)

  console.log('Expected', res.expected)
  console.log('On line', lineNumber)
  console.log(colors.dim, tmpAA.join('\n'))
  console.log(colors.reset, line)
  console.log(' '.repeat(space), '^')
  console.log(colors.dim, tmpBB.join('\n'))
  console.log(colors.reset, '')
}
