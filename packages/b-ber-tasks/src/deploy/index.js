/* eslint-disable camelcase */

import path from 'path'
import readline from 'readline'
import { exec, execSync } from 'child_process'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'

const cwd = process.cwd()
const cmd = 'deploy'
const args = new Map([
    ['epub', '--include "*.epub"'],
    ['mobi', '--include "*.mobi"'],
    ['pdf', '--include "*.pdf"'],
    ['reader', '--include "project-reader/*"'],
    ['web', '--include "project-web/*"'],
])

function showHelp() {
    console.log(`
    Usage: bber ${cmd} <builds>

    Deploy a b-ber project to Amazon S3

    Positionals:
      builds  Build types                       [epub|mobi|reader|web|pdf]

    Options:
      --version   Show version number                            [boolean]
      -h, --help  Show help                                      [boolean]
    `)
}

async function ensureAwsCli() {
    try {
        execSync('aws --version > /dev/null 2>&1', { cwd })
    } catch (err) {
        console.log('')
        console.log(err.message)
        console.log('')
        console.log('AWS CLI must be installed to run deploy')
        console.log(
            'See installation instructions here: https://docs.aws.amazon.com/cli/latest/userguide/installing.html'
        )
        console.log('')
        process.exit(1)
    }
}

function deploy({ bucketURL, awsRegion, builds }) {
    return new Promise(resolve => {
        const sourceDir = path.resolve(cwd, './')

        // uses 'cp' by default.
        // TODO: allow different upload strategies?
        // @issue: https://github.com/triplecanopy/b-ber/issues/224
        let command = [`aws s3 cp ${sourceDir} ${bucketURL}`, '--recursive', '--exclude "*"', `--region ${awsRegion}`]

        builds.forEach(arg => command.push(args.get(arg)))

        command = command.join(' ')

        const proc = exec(command, { cwd })

        proc.stdout.on('data', data => console.log(String(data)))
        proc.stderr.on('data', data => console.log(String(data)))

        proc.on('error', err => {
            console.log('')
            console.log('ERROR: aws encountered an error')
            console.log(err.message)
            console.log(err.stack)
        })

        proc.on('close', code => {
            if (code !== 0) {
                console.log('')
                console.log(`ERROR: aws exited with code ${code}`)
            }

            resolve()
        })
    })
}

function ensureEnvVars() {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, BBER_BUCKET_REGION } = process.env

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !BBER_BUCKET_REGION) {
        log.error(
            '[AWS_ACCESS_KEY_ID], [AWS_SECRET_ACCESS_KEY] and [BBER_BUCKET_REGION] must be set to deploy the project'
        )
    }

    const configFile = path.resolve(cwd, 'config.yml')
    const config = YamlAdaptor.load(configFile)
    const { bucket_url: bucketURL } = config

    if (!bucketURL) {
        log.error('[bucketURL] must be set in config.yml to deploy the project')
    }

    return { bucketURL, awsRegion: BBER_BUCKET_REGION }
}

function prompt() {
    return ensureAwsCli()
        .then(ensureEnvVars)
        .then(response => {
            const rl = readline.createInterface(process.stdin, process.stdout)
            const { bucketURL, awsRegion } = response
            const builds = process.argv
                .slice(process.argv.lastIndexOf(cmd) + 1)
                .map(str => str.toLowerCase())
                .filter(arg => args.has(arg))

            if (!builds.length) {
                showHelp()
                process.exit(0)
            }

            console.log('')
            console.log('Does the following look OK?')
            console.log('')
            console.log(` Bucket URL:    ${bucketURL}`)
            console.log(` AWS Region:    ${awsRegion}`)
            console.log(` Builds:        ${builds.join(' ')}`)
            console.log('')

            rl.setPrompt(' [yN] ')
            rl.prompt()

            rl.on('line', data => {
                if (data === 'y' || data === 'yes') {
                    return deploy({ bucketURL, awsRegion, builds })
                        .then(() => rl.close())
                        .catch(log.error)
                }
                rl.close()
            }).on('close', () => {
                console.log('')
                process.exit(0)
            })
        })
        .catch(log.error)
}

const main = () => prompt()

export default main
