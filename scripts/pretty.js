const path = require('path')
const { exec } = require('child_process')

const errors = []
const proc = exec(
    `${path.join(
        __dirname,
        '..',
        'node_modules/.bin/prettier'
    )} --config ${path.join(
        __dirname,
        '..',
        '.prettierrc'
    )} ./packages/**/*.js -l`
)

proc.stdout.on('data', data => errors.push(`${data}`.trim()))
proc.stderr.on('data', data => console.error(`${data}`))

proc.on('close', () => {
    if (!errors.length) return
    process.stdout.write('Prettier found errors in the following files:\n')
    errors.forEach(err => process.stdout.write(`${err}\n`))
    process.stdout.write('\n')
    process.exit(1)
})
