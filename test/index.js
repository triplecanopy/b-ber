
import test from 'ava'
import fs from 'fs-extra'

const report = (err) => {
  if (err) { throw err }
}

test.before(t => fs.writeFile('./test.txt', 'Some data', err => report(err)))
test.after(t => fs.remove('./test.txt', err => report(err)))

test('Promises resolve after I/O callback', async (t) => {

  t.plan(1)

  const promise = () =>
    new Promise((resolve, reject) =>
      fs.readFile('test.txt', 'utf8', (err, data) => resolve(data)))
  t.regex(await promise(), /Some data/)
})

test('Errors in promises are rejected', async (t) => {

  t.plan(1)

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

test('fs.statSync reports an error when nested in a promise', async (t) => {

  t.plan(4)

  const filename = 'non-existent'
  const message = `ENOENT: no such file or directory, stat '${filename}'`

  const fail1 = () => new Promise((resolve, reject) => {
    try {
      if (fs.statSync(filename)) { resolve() }
    } catch (err) {
      throw err
    }
  })

  const fail2 = () => new Promise((resolve, reject) => {
    try {
      if (fs.statSync(filename)) { resolve() }
    } catch (err) {
      reject(err)
    }
  })

  await t.throws(fail1(), message)
  await t.throws(fail2(), message)
  fail1().catch(err => t.is(err.message, message))
  fail2().catch(err => t.is(err.message, message))
})
