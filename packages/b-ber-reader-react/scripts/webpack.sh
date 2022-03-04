#! /bin/bash

# Script is configured with NODE_ENV when running `npm run webpack:src` or `npm run webpack:dist`
# Additionally accepts positional for custom Webpack script. Examples below
#
#
# Running in development
#
# npm run webpack:src
#   npm run clean && NODE_ENV=development webpack --config webpack/config.development.js --progress --profile --colors --mode development -w --verbose
#
#
# Running in production
#
# npm run webpack:dist
#   npm run clean && NODE_ENV=production webpack --config webpack/config.production.js --progress --profile --colors --mode production
#
#
# Running in production with custom Webpack config
#
# npm run webpack:dist ./webpack/custom.config.js
#   npm run clean && NODE_ENV=production webpack --config ./webpack/custom.config.js --progress --profile --colors --mode production
#


ENV=$([[ $NODE_ENV = "production" ]] && echo "production" || echo "development")
CONFIG=$([[ -z $1 ]] && echo "webpack/config.${ENV}.js" || echo "$1")
FLAGS=$([[ $NODE_ENV = "production" ]] && echo "--mode production" || echo "--mode development -w --verbose")

npm run clean
NODE_ENV="$ENV" webpack --config "$CONFIG" --progress --profile --colors "$FLAGS"