
// npm run -s mocha:single -- ./src/output/opf/__tests__/opf.js
//

// const chai = require('chai')
// const sinon = require('sinon')
// const sinonChai = require('sinon-chai')
// const chaiAsPromised = require('chai-as-promised')

// const should = chai.should() // eslint-disable-line no-unused-vars
// chai.use(chaiAsPromised)
// chai.use(sinonChai)

// const bunyan = require('bunyan')
// const loader = require('../loader').default
// const actions = require('../state').default
// const Opf = require('../tasks/opf').default

// const { log, logg } = require('../log') // eslint-disable-line no-unused-vars

// let opf = new Opf()

// describe('module:opf', () => {
//   let consoleErrors = []
//   let consoleWarnings = []

//   before(() => {
//     // instantiation
//     loader(() => actions.setBber({ build: 'epub' }))

//     // send bunyan logging to arrays to validate in describe blocks
//     bunyan.prototype.error = function error(message) {
//       consoleErrors.push({ message })
//     }
//     bunyan.prototype.warn = function warn(message) {
//       consoleWarnings.push({ message })
//     }
//   })

//   // clear application errors
//   beforeEach(() => {
//     consoleErrors = []
//     consoleWarnings = []
//   })

//   describe('#init', () => {
//     beforeEach(() => { opf = new Opf() })

//     it('Should return a formatted XML string', () =>
//       opf.init().should.eventually.match(/<\?xml version="1.0" encoding="UTF-8"\?>/)
//     )

//     it('Should catch errors, log them to the console, and continue execution', () =>
//       new Promise(resolve/* , reject */ =>
//         Promise.all([
//           Promise.resolve(1),
//           Promise.resolve(2)
//         ])
//         .then(() => Promise.reject('foo'))
//         .catch(err => log.error(err))
//         .then(() => {
//           consoleErrors.should.have.length(1)
//           consoleErrors[0].message.should.equal('foo')
//           resolve()
//         }).should.eventually.be.fulfilled
//       )
//     )

//     it('Should call the subordinate methods', () => {
//       const promise1 = sinon.spy(opf, 'createOpfPackageString')
//       const promise2 = sinon.spy(opf, 'writeOpfToDisk')
//       return opf.init().then(() => {
//         promise1.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
//         return promise2.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
//       })
//     })

//     it('Should call the subordinate methods in the correct order', () => {
//       const promise1 = sinon.spy(opf, 'createOpfPackageString')
//       const promise2 = sinon.spy(opf, 'writeOpfToDisk')
//       return opf.init().then(() =>
//         promise1.should.have.been.calledBefore(promise2) // eslint-disable-line no-unused-expressions
//       )
//     })
//   })

//   describe('#createOpfPackageString', () => {
//     it('Should create a formatted XML string from a JavaSript object')
//   })

//   describe('#writeOpfToDisk', () => {
//     it('Should write a file to disk')
//   })
// })
