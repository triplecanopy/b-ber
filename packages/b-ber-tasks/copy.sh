#!/usr/bin/env bash

# keep in sync with scripts in package.json
declare -a browserFiles=(
    "src/web/search.js"
    "src/web/worker.js"
    "src/web/navigation.js"
    "src/web/event-handlers.js"
)

declare -a nodeFiles=(
    "src/serve/server-web.js"
    "src/serve/server-reader.js"
)

for file in "${browserFiles[@]}"
do
    out="${file/src/dist}"
    node_modules/.bin/uglifyjs $file -o $out
done

for file in "${nodeFiles[@]}"
do
    out="${file/src/dist}"
    cp $file $out
done
