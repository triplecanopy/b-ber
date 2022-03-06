/* eslint-disable import/no-extraneous-dependencies */

const { clone, setWith } = require('lodash')
const prevConfig = require('./config.development')

const nextConfig = setWith(
  clone(prevConfig),
  'entry.css',
  './custom.scss',
  clone
)

module.exports = nextConfig
