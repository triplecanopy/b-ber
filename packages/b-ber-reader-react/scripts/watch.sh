#! /bin/bash

# Script accepts parameters for a custom Webpack config file. Defaults to
# webpack/config.production.js
#
#
# Examples:
#
# npm watch
#
# npm watch webpack/config.custom.js
#

CONFIG=$([[ -z $1 ]] && echo "webpack/config.production.js" || echo "$1")

npm run clean
NODE_ENV=production webpack --mode production -w --config "$CONFIG"