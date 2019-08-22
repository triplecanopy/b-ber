import path from 'path'
import readline from 'readline'
import { exec, execSync } from 'child_process'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'

const cwd = process.cwd()
const defaultBuilds = ['epub', 'mobi', 'reader']
const args = new Map([
    ['epub', '--include "*.epub"'],
    ['mobi', '--include "*.mobi"'],
    ['pdf', '--include "*.pdf"'],
    ['xml', '--include "*.xml"'],
    ['reader', '--include "project-reader/*"'],
    ['web', '--include "project-web/*"'],
])

// set far off cache for all files
const cacheArgsBucket = [
    '--recursive',
    '--metadata-directive REPLACE',
    '--expires 2034-01-01T00:00:00Z',
    '--acl public-read',
    '--cache-control max-age=31536000,public',
]

// set immediate re-fetch for XML, JSON and downloads
const cacheArgsFiles = [
    '--recursive',
    '--exclude "*"',
    '--include "*.html"',
    '--include "*.xhtml"',
    '--include "*.ncx"',
    '--include "*.opf"',
    '--include "*.json"',
    '--include "*.epub"',
    '--include "*.mobi"',
    '--include "*.pdf"',
    '--include "*.xml"',
    '--metadata-directive REPLACE',
    '--expires 1970-01-01T00:00:00Z',
    '--acl public-read',
    '--cache-control max-age=0,public',
]

async function ensureAwsCli() {
    try {
        execSync('aws --version > /dev/null 2>&1', { cwd })
    } catch (err) {
        console.log('AWS CLI must be installed to run deploy')
        console.log(
            'See installation instructions here: https://docs.aws.amazon.com/cli/latest/userguide/installing.html'
        )
        process.exit(0)
    }
}

function run(command, callback) {
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

        if (callback) callback()
    })
}

function deploy({ bucketURL, awsRegion, builds }) {
    console.log('')
    console.log('Uploading project files...')
    return new Promise(resolve => {
        const sourceDir = path.resolve(cwd, './')
        let command = [`aws s3 cp ${sourceDir} ${bucketURL}`, '--recursive', '--exclude "*"', `--region ${awsRegion}`]

        builds.forEach(arg => command.push(args.get(arg)))

        command = command.join(' ')

        return run(command, resolve)
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

function extractVars(config) {
    const { bucketURL, awsRegion } = config

    let { builds } = config
    if (!builds || !builds.length) builds = defaultBuilds
    builds = builds.map(str => str.toLowerCase()).filter(arg => args.has(arg))

    return { bucketURL, awsRegion, builds }
}

function deployWithPrompt(config) {
    return new Promise(resolve => {
        const rl = readline.createInterface(process.stdin, process.stdout)
        const { bucketURL, awsRegion, builds } = config

        console.log('')
        console.log('Does the following look OK?')
        console.log('')
        console.log(` Bucket URL:    ${bucketURL}`)
        console.log(` AWS Region:    ${awsRegion}`)
        console.log(` Builds:        ${builds.join(', ')}`)
        console.log('')

        rl.setPrompt(' [yN] ')
        rl.prompt()

        rl.on('line', data => {
            if (data === 'y' || data === 'yes') {
                return deploy({ bucketURL, awsRegion, builds }).then(() => rl.close())
            }

            process.exit(0)
        }).on('close', resolve)
    })
}

function deployWithoutPrompt(config) {
    log.notice('Deploy command run with "--yes", skipping confirmation')
    return deploy(config)
}

function setCachePolicy({ bucketURL, awsRegion }, cacheArgs) {
    console.log('Setting cache policy...')
    const command = [`aws s3 cp ${bucketURL} ${bucketURL}`, `--region ${awsRegion}`].concat(cacheArgs).join(' ')
    return new Promise(resolve => run(command, resolve))
}

function main({ builds, yes }) {
    let config = {}
    return ensureAwsCli()
        .then(ensureEnvVars)
        .then(response => {
            config = extractVars({ ...response, builds })

            if (yes) return deployWithoutPrompt(config)
            return deployWithPrompt(config)
        })
        .then(() => setCachePolicy(config, cacheArgsBucket))
        .then(() => setCachePolicy(config, cacheArgsFiles))
        .catch(log.error)
}

export default main
