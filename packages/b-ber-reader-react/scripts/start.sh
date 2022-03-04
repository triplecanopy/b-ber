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

CMD_1="npm run webpack:src $1"
CMD_2="npm run serve"

concurrently "$CMD_1" "$CMD_2"