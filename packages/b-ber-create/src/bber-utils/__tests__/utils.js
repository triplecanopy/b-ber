'use strict'

// npm run -s mocha:single -- ./src/bber-utils/__tests__/utils.js

/* eslint-disable no-multi-spaces, no-unused-expressions */

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

const fs = require('fs-extra')
const path = require('path')

const store = require('../../bber-lib/store').default
const ver = require('../../../package.json').version
const utils = require('../../bber-utils')

// utils
const opsPath             = utils.opsPath
const cjoin               = utils.cjoin
const fileId              = utils.fileId
const copy                = utils.copy
const guid                = utils.guid
const lpad                = utils.lpad
const hrtimeformat        = utils.hrtimeformat
const hashIt              = utils.hashIt
const getImageOrientation = utils.getImageOrientation
const getFrontmatter      = utils.getFrontmatter
const src                 = utils.src
const dist                = utils.dist
const build               = utils.build
const env                 = utils.env
const theme               = utils.theme
const version             = utils.version
const metadata            = utils.metadata
const promiseAll          = utils.promiseAll

const cwd = process.cwd()

describe('module:utils', () => {
    beforeEach(() => store.reset())

    describe('#cjoin', () => {
        it('Should remove falsey values from an array and join the elements with newlines', () => {
            cjoin(['foo', false, 'bar', 0, null, 'baz', '']).should.equal('foo\nbar\nbaz')
        })
    })

    describe('#getImageOrientation', () => {
        it('Calculates the ratio an image and return the appropriate class name', () => {
            getImageOrientation(2, 2).should.equal('square')
            getImageOrientation(2, 1).should.equal('landscape')
            getImageOrientation(4, 5).should.equal('portrait')
            getImageOrientation(1, 2).should.equal('portrait-high')
        })
    })

    describe('#promiseAll', () => {
        it('Is a convenience wrapper around `Promise.all`', () => {
            const p1 = Promise.resolve('foo')
            const p2 = Promise.resolve('bar')
            return promiseAll([p1, p2]).then((resp) => {
                resp.should.be.an('array')
                resp.should.have.length(2)
                resp[0].should.equal('foo')
                resp[1].should.equal('bar')
            })
        })
    })

    describe('#copy', () => {
        const fromPath = path.join(cwd, './src/__tests__/.tmp/from')
        const toPath = path.join(cwd, './src/__tests__/.tmp/to')
        const inFile = path.join(fromPath, 'file.txt')
        const outFile = path.join(toPath, 'file.txt')

        it('Copies assets from one location to another', () =>
            // adding what _should_ be in `before`/`after` calls here since `mkdirp`
            // runs async, and we need to make sure the promise resolves before
            // unlinking the test files
            fs.mkdirp(fromPath, (err0) => {
                if (err0) { throw err0 }
                fs.writeFile(inFile, 'foo', (err2) => {
                    if (err2) { throw err2 }
                })
                fs.mkdirp(toPath, (err1) => {
                    if (err1) { throw err1 }

                    return copy(inFile, outFile).then(() => {
                        // assert
                        fs.existsSync(outFile).should.be.true
                        fs.readFileSync(outFile, 'utf8').should.equal('foo')

                        // cleanup
                        fs.unlinkSync(inFile)
                        fs.unlinkSync(outFile)
                        fs.remove(fromPath, (err2) => {
                            if (err2) { throw err2 }
                        })
                        fs.remove(toPath, (err3) => {
                            if (err3) { throw err3 }
                        })
                    }).should.be.fulfilled
                })
            })
        )
    })

    describe('#opsPath', () => {
        it('Returns the path to the OPS directory relative to a file', () => {
            opsPath('foo/bar/OPS', 'foo/bar').should.equal('')
        })
    })
    describe('#fileId', () => {
        it('Creates an XML-safe element id', () => {
            fileId('1.:ß').should.equal('_1___')
        })
    })
    describe('#guid', () => {
        it('Generates a GUID', () => {
            guid().should.match(/\w{8}-\w{4}-4\w{3}-\w{4}-\w{12}/)
        })
    })
    describe('#lpad', () => {
        it('Pads a string from the left', () => {
            lpad('f', 'o', 3).should.equal('oof')
        })
    })
    describe('#hrtimeformat', () => {
        it('Formats `process.hrtime` in ms', () =>
            hrtimeformat([1, 1000000]).should.equal('1ms')
        )
    })
    describe('#hashIt', () => {
        it('Creates a hash from a string', () => {
            hashIt('foo').should.equal('_101574')
        })
    })
    describe('#getFrontmatter', () => {
        it('Retrieves a file\'s frontmatter from the global store', (done) => {
            // store reference to original array
            const origPages = Array.prototype.slice.call(0, store.pages)
            const tmpPath = path.join(cwd, 'src/__tests__/.tmp')
            const filePath = path.join(tmpPath, 'getFrontmatter.xhtml')

            const attr = 'title'
            const val = 'foo'

            const fileContents = `---\n${attr}: ${val}`
            const fileData = { filename: path.basename(filePath, '.xhtml'), title: val }

            // setup test
            store.pages = [fileData]

            return fs.writeFile(filePath, fileContents, (err0) => {
                if (err0) { throw err0 }

                // assert
                getFrontmatter({ name: filePath }, attr).should.equal(val)

                // reset store
                store.pages = origPages

                // clean .tmp
                fs.unlink(filePath, (err1) => {
                    if (err1) { throw err1 }
                    done()
                })
            })
        })
    })

    describe('#src', () => {
        it('Retrieves the `src` directory from the global store')//, () => {
        //     store.update('build', 'epub')
        //     src().should.equal(path.join(cwd, '_book'))
        // })
    })
    describe('#dist', () => {
        it('Retrieves the `dist` directory from the global store')//, () => {
        //     store.update('build', 'mobi')
        //     dist().should.equal(path.join(cwd, 'book-mobi'))
        // })
    })
    describe('#build', () => {
        it('Retrieves the `build` property from the global store', () => {
            store.update('build', 'mobi')
            build().should.equal('mobi')
        })
    })
    describe('#env', () => {
        it('Retrieves the `env` property from the global store', () =>
            env().should.equal('test')
        )
    })
    describe('#metadata', () => {
        it('Retrieves the `metadata` property from the global store', () =>
            metadata().should.be.an('array')
        )
    })
    describe('#version', () => {
        it('Retrieves the `version` property from the global store', () => {
            version().should.equal(ver)
        })
    })
})
