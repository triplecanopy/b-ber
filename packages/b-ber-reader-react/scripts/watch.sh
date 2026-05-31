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

CONFIG=$([[ -z $1 ]] && echo "webpack/config.development.js" || echo "$1")

# Kill any process already holding the dev server port so restarts don't fail
# with EADDRINUSE. Errors are silenced — it's fine if nothing is listening.
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

npm run clean
NODE_ENV=development webpack serve --config "$CONFIG"