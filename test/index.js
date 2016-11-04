
import test from 'ava'
import fs from 'fs-extra'

const report = (err) => {
  if (err) { throw err }
}

test.before(t => fs.writeFile('./test.txt', 'Some data', err => report(err)))
test.after(t => fs.remove('./test.txt', err => report(err)))

test('Promises resolve after I/O callback', async (t) => {
  const promise = () =>
    new Promise((resolve, reject) =>
      fs.readFile('test.txt', 'utf8', (err, data) => resolve(data)))
  t.regex(await promise(), /Some data/)
})

test('Errors in promises are rejected', async (t) => {
  const message = 'Error'
  const promise = () =>
    new Promise((resolve, reject) => reject(new Error(message)))

  await t.throws(promise(), message)
})

test('Errors in chained promises are caught', async (t) => {
  const error = new Error('Error')
  const succeed = () =>
    new Promise((resolve, reject) => resolve())
  const fail = () =>
    new Promise((resolve, reject) => reject(error))

  succeed()
  .then(fail)
  .catch(err => t.is(err, error))
})
