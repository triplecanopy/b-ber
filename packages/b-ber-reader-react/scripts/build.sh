#! /bin/bash

# Script accepts parameters for a custom Webpack config file. Defaults to
# webpack/config.production.js
#
#
# Examples:
#
# npm build
#
# npm build webpack/config.custom.js
#

npm run webpack:dist "$1"
mkdir -p ../b-ber-reader/dist
cp -r dist/. ../b-ber-reader/dist/
