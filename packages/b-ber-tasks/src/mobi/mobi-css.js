/**
 * @module mobiCss
 */


import fs from 'fs-extra'
import css from 'css'
import path from 'path'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

const blackListedPrefixes = ['epub|']
const blackListedTypes = ['namespace']

// CSS declarations that break mobi files
const blackListedProperties = [
    'line-height',
    '-webkit-hyphens',
    '-epub-hyphens',
    'adobe-hyphenate',
    '-moz-hyphens',
    '-ms-hyphens',
    'hyphens',
    'word-break',
    'word-break',
    'widows',
    'orphans',
    'text-rendering',
    '-webkit-font-smoothing',
    '-moz-osx-font-smoothing',
    '-webkit-text-fill-color',
]

const write = ({file, content}) =>
    new Promise(resolve =>
        fs.writeFile(file, content, 'utf8', err => {
            if (err) throw err
            log.info(`mobiCSS write [${path.basename(file)}]`)
            resolve()
        })
    )

const process = file =>
    new Promise(resolve =>
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) throw err
            const ast = css.parse(data)
            let i = ast.stylesheet.rules.length - 1
            while (i >= 0) {
                const rule = ast.stylesheet.rules[i]
                if (rule.selectors) {
                    let j = rule.selectors.length - 1
                    while (j >= 0) {
                        let jj = 0
                        while (jj < blackListedPrefixes.length) {
                            if (rule.selectors[j].slice(0, blackListedPrefixes[jj].length) === blackListedPrefixes[jj]) {
                                log.info('mobiCSS remove selector', rule.selectors[j])
                                rule.selectors.splice(j, 1)
                            }
                            jj++ // eslint-disable-line no-plusplus
                        }
                        j-- // eslint-disable-line no-plusplus
                    }
                }
                if (blackListedTypes.indexOf(rule.type) > -1) {
                    log.info(`mobiCSS remove ${rule.type} [${rule[rule.type]}]`)
                    ast.stylesheet.rules.splice(i, 1)
                }
                if (ast.stylesheet.rules[i]) {
                    const {declarations} = ast.stylesheet.rules[i]
                    if (declarations) {
                        let a = declarations.length - 1
                        while (a >= 0) {
                            if (blackListedProperties.indexOf(declarations[a].property) > -1) {
                                log.info(`mobiCSS remove property [${declarations[a].property}]`)
                                declarations.splice(a, 1)
                            }
                            a-- // eslint-disable-line no-plusplus
                        }
                    }
                }
                i-- // eslint-disable-line no-plusplus
            }
            const content = css.stringify(ast)
            resolve({file, content})
        })
    )

const mobiCSS = () =>
    new Promise(resolve =>
        fs.readdir(path.join(state.dist, 'OPS', 'stylesheets'), (err, files) => {
            if (err) throw err

            const promises = files.map(a => {
                const file = path.join(state.dist, 'OPS', 'stylesheets', a)
                log.info(`mobiCSS process [${path.basename(file)}]`)
                return process(file).then(write)
            })

            Promise.all(promises).then(resolve)
        })
    )

export default mobiCSS
