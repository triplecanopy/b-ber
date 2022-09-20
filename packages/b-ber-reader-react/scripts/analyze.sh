npm run clean
NODE_ENV=production webpack --config webpack/config.production.js --progress --profile --color --profile --json > stats.json
npm run webpack-bundle-analyzer ./stats.json