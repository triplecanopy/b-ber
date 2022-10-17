const { clone, setWith } = require('lodash')
const prevConfig = require('./config.development')

const nextConfig = setWith(clone(prevConfig), 'styles', './custom.scss', clone)

module.exports = nextConfig
