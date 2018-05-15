/* eslint-disable camelcase */

/**
* @module deploy
*/


import path from 'path'
import readline from 'readline'
import {exec, execSync} from 'child_process'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'

const cwd = process.cwd()
const rl = readline.createInterface(process.stdin, process.stdout)


function ensureAwsCli() {
    return new Promise(resolve => {
        try {
            execSync('aws --version > /dev/null 2>&1', {cwd})
        } catch (err) {
            console.log(``)
            console.log(err.message)
            console.log(``)
            console.log(`AWS CLI must be installed to run deploy`)
            console.log(`See installation instructions here: https://docs.aws.amazon.com/cli/latest/userguide/installing.html`)
            console.log(``)
            process.exit(1)
        }

        resolve()
    })
}

function deploy({bucketURL, awsRegion}) {
    return new Promise(resolve => {
        const sourceDir = path.resolve(cwd, './')
        const command = `aws s3 cp ${sourceDir} ${bucketURL} \\
                        --recursive \\
                        --exclude "*" \\
                        --include "*.epub" \\
                        --include "*.mobi" \\
                        --include "*.pdf" \\
                        --include "project-reader/*" \\
                        --include "project-web/*" \\
                        --region ${awsRegion}`

        const proc = exec(command, {cwd})

        proc.stdout.on('data', data => console.log(String(data)))
        proc.stderr.on('data', data => console.log(String(data)))

        proc.on('error', err => {
            console.log(``)
            console.log(`ERROR: aws encountered an error`)
            console.log(err.message)
            console.log(err.stack)
        })

        proc.on('close', code => {
            if (code !== 0) {
                console.log(``)
                console.log(`ERROR: aws exited with code ${code}`)
            }

            resolve()
        })
    })
}


function ensureEnvVars() {
    return new Promise(resolve => {
        const {AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BBER_BUCKET_REGION} = process.env

        if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BBER_BUCKET_REGION) {
            log.error(`[AWS_ACCESS_KEY_ID], [AWS_SECRET_ACCESS_KEY] and [S3_BBER_BUCKET_REGION] must be set to deploy the project`)
        }

        const configFile = path.resolve(cwd, 'config.yml')
        const config = YamlAdaptor.load(configFile)
        const {bucket_url} = config

        if (!bucket_url) log.error(`[bucket_url] must be set in config.yml to deploy the project`)

        resolve({bucketURL: bucket_url, awsRegion: S3_BBER_BUCKET_REGION})
    })
}

function ensure() {
    return new Promise(resolve =>
        ensureAwsCli()
            .then(ensureEnvVars)
            .then(resolve)
    )
}

function prompt() {
    return new Promise(resolve => {
        ensure().then(response => {
            const {bucketURL, awsRegion} = response

            console.log(``)
            console.log('Does the following look OK?')
            console.log(``)
            console.log(` Bucket URL:    ${bucketURL}`)
            console.log(` AWS Region:    ${awsRegion}`)
            console.log(``)

            rl.setPrompt(' [yN] ')
            rl.prompt()

            rl.on('line', data => {
                if (data === 'y' || data === 'yes') {
                    return deploy({bucketURL, awsRegion})
                        .then(() => rl.close())
                        .then(resolve)
                        .catch(log.error)
                }
                rl.close()
            }).on('close', () => {
                console.log(``)
                process.exit(0)
            })

        })
    })
}

const main = () => new Promise(resolve => prompt(resolve))

export default main
