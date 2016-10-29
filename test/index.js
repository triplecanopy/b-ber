
import test from 'ava'
import fs from 'fs-extra'

const report = (err) => {
  if (err) { throw err }
}

test.before(t => fs.writeFile('./test.txt', 'Some data', err => report(err)))
test.after(t => fs.remove('./test.txt', err => report(err)))

test('Promise resolves after I/O callback', async (t) => {
  const promise = () =>
    new Promise((resolve, reject) =>
      fs.readFile('test.txt', 'utf8', (err, data) => resolve(data)))
  t.regex(await promise(), /Some data/)
})

