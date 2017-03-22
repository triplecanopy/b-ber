
// npm run -s mocha:single -- ./src/utils/__tests__/utils.js

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const should = chai.should() // eslint-disable-line no-unused-vars
chai.use(chaiAsPromised)

const fs = require('fs-extra')
const path = require('path')

const store = require('../../lib/store').default
const utils = require('../../utils')
const ver = require('../../../package.json').version

const { opsPath, cjoin, fileId, copy, guid, rpad, lpad, hrtimeformat, hashIt,
  updateStore, getImageOrientation, getFrontmatter, orderByFileName, entries,
  src, dist, build, env, theme, version, metadata, promiseAll } = utils

const cwd = process.cwd()

describe('module:utils', () => {
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
      getImageOrientation(1, 2).should.equal('portraitLong')
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
            fs.existsSync(outFile).should.be.true // eslint-disable-line no-unused-expressions
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
    it('Creates an HTML-safe element id', () => {
      fileId('ß Ff').should.match(/__Ff/)
    })
  })
  describe('#guid', () => {
    it('Generates a GUID', () => {
      guid().should.match(/\w{8}-\w{4}-4\w{3}-\w{4}-\w{12}/)
    })
  })
  describe('#rpad', () => {
    it('Pads a string from the right', () => {
      rpad('f', 'o', 3).should.equal('foo')
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
  describe('#updateStore', () => {
    it('Should act as a convenience method to update the global store', () => {
      store.update('pages', [])
      updateStore('pages', { id: 1 })
      updateStore('pages', { id: 2 })
      store.pages.should.have.length(2)
    })
  })
  describe('#getFrontmatter', () => {
    it('Retrieves a file\'s frontmatter from the global store', () => {
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
        })
      })
    })
  })
  describe('#orderByFileName', () => {
    it('Should return an empty array if no argument is passed', () => {
      orderByFileName().should.be.an('array')
      orderByFileName().should.have.length(0)
    })
    it('Orders a list of objects by the `name` property', () => {
      const arr = orderByFileName([{ name: '2_file' }, { name: '1_file' }])
      arr.should.be.an('array')
      arr[0].name.should.equal('1_file')
      arr[1].name.should.equal('2_file')
    })
  })
  describe('#entries', () => {
    it('Creates an iterator from a JavaScript object', () => {
      let key
      let val
      for (const [k, v] of entries({ prop: 'attr' })) {
        key = k
        val = v
      }
      key.should.equal('prop')
      val.should.equal('attr')
    })
  })

  // DEPRECATED
  //
  describe('#getVal', () => {
    it('DEPRECATED: Retrieves a value from the configuration instance\'s `_config` property')
  })

  describe('#src', () => {
    it('Retrieves the `src` directory from the global store', () => {
      store.update('build', 'epub')
      src().should.equal(path.join(cwd, '_book'))
    })
  })
  describe('#dist', () => {
    it('Retrieves the `dist` directory from the global store', () => {
      store.update('build', 'mobi')
      dist().should.equal(path.join(cwd, 'book-mobi'))
    })
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
  describe('#theme', () => {
    it('Retrieves the `theme` directory from the global store', () => {
      const t = theme()
      t.should.be.an('object')
      t.should.have.property('tpath')
      t.tpath.should.equal(path.join(cwd, 'themes', t.tname))
    })
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
