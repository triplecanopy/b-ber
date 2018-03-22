'use strict'

// npm run -s mocha:single -- ./src/bber-output/__tests__/generate.js

const chai = require('chai')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)
chai.use(sinonChai)

const path = require('path')
const fs = require('fs-extra')

const state = require('../../bber-lib/state').default
const Generate = require('../generate').default
const logger = require('../../__tests__/helpers/console')
const g = new Generate()

describe('module:generate', () => {
    const srcDir = path.join(process.cwd(), 'src/__tests__/.tmp/generate')
    const mdDir = path.join(srcDir, '_markdown')
    const mdFile = '00001.md'

    // clear application errors
    beforeEach(() => logger.reset())

    const _setup = (callback) => {
        Object.defineProperty(Generate.prototype, 'src', {
            get() {
                return srcDir
            }
        })

        fs.mkdirs(mdDir, (err0) => {
            if (err0) throw err0
            return fs.writeFile(path.join(mdDir, mdFile), '', (err1) => {
                if (err1) throw err1
                state.update('build', 'epub')
                return callback()
            })
        })
    }

    const _teardown = (callback) => {} // eslint-disable-line no-unused-vars

    describe('#getFiles', () => {
        it('Gets a list of Markdown files in the source directory', done =>
            _setup(() =>
                g.getFiles(mdDir).then((resp) => {
                    resp.should.be.an('array')
                    resp[0].name.should.equal(mdFile)
                    done()
                })
            )
        )
    })
    describe('#parseMeta', () => {
        it('Extracts frontmatter values from command line arguments')
    })
    describe('#createFile', () => {
        it('Writes a file with yaml frontmatter')
    })
    describe('#writeFile', () => {
        it('Writes a new Markdown file to disk')
    })
    describe('#writePageMeta', () => {
        it('Writes a new `<type>.yml` config file to disk if one does not exist')
        it('Updates an existing `<type>.yml` config file to disk if one already exists')
        it('Writes a new Markdown file to disk')
        it('Throws an error if a Markdown file with the same name already exists')
    })
})
