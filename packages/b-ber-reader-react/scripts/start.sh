#! /bin/bash

# Script accepts parameters for a custom Webpack config file. Defaults to
# webpack/config.development.js
#
#
# Examples:
#
# npm start
#
# npm start webpack/config.custom.js
#

npm run watch "$1"