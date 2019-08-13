const https = require('https')
const querystring = require('querystring')

const baseURL = process.env.BBER_CI_BASE_URL
const dist = (process.env.npm_config_dist_tag || '').toUpperCase()

if (!dist) return

console.log('Running remote tests...')

const id = process.env[`BBER_CI_ID_${dist}`]
const ref = process.env[`BBER_CI_REF_${dist}`]
const token = process.env[`BBER_CI_TOKEN_${dist}`]

if (!id || !ref || !token) {
    console.log('CI environment variables not configured')
    return
}

const data = querystring.stringify({ token })

const options = {
    host: process.env.BBER_CI_HOST,
    port: process.env.BBER_CI_PORT,
    path: `${baseURL}/${id}/ref/${ref}/trigger/pipeline`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
    },
}

const req = https.request(options, res => console.log('Status:', res.statusCode))

req.on('error', console.error)
req.write(data)
req.end()
